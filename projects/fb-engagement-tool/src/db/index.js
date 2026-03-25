const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/app.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS scenarios (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    steps       TEXT NOT NULL,   -- JSON array of comment steps
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS runs (
    id           TEXT PRIMARY KEY,
    post_url     TEXT NOT NULL,
    scenario_id  TEXT,
    mode         TEXT NOT NULL,  -- 'comment' | 'dm'
    status       TEXT DEFAULT 'pending',  -- pending|running|done|error
    created_at   TEXT DEFAULT (datetime('now','localtime')),
    finished_at  TEXT,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
  );

  CREATE TABLE IF NOT EXISTS run_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id     TEXT NOT NULL,
    level      TEXT DEFAULT 'info',   -- info|success|warn|error
    message    TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (run_id) REFERENCES runs(id)
  );

  CREATE TABLE IF NOT EXISTS members (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      TEXT NOT NULL,
    fb_name     TEXT,
    profile_url TEXT,
    dm_status   TEXT DEFAULT 'pending',  -- pending|sent|failed|skip
    sent_at     TEXT,
    FOREIGN KEY (run_id) REFERENCES runs(id)
  );
`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scenarios = {
  list: () => db.prepare('SELECT * FROM scenarios ORDER BY created_at DESC').all(),
  get: (id) => db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id),
  create: (row) => db.prepare('INSERT INTO scenarios (id,name,description,steps) VALUES (@id,@name,@description,@steps)').run(row),
  update: (row) => db.prepare('UPDATE scenarios SET name=@name, description=@description, steps=@steps WHERE id=@id').run(row),
  delete: (id) => db.prepare('DELETE FROM scenarios WHERE id = ?').run(id),
};

const runs = {
  create: (row) => db.prepare('INSERT INTO runs (id,post_url,scenario_id,mode) VALUES (@id,@post_url,@scenario_id,@mode)').run(row),
  setStatus: (id, status) => {
    const finished = ['done','error'].includes(status) ? "datetime('now','localtime')" : 'NULL';
    db.prepare(`UPDATE runs SET status=?, finished_at=${finished} WHERE id=?`).run(status, id);
  },
  list: () => db.prepare('SELECT * FROM runs ORDER BY created_at DESC LIMIT 50').all(),
  get: (id) => db.prepare('SELECT * FROM runs WHERE id = ?').get(id),
};

const logs = {
  add: (run_id, message, level = 'info') =>
    db.prepare('INSERT INTO run_logs (run_id,level,message) VALUES (?,?,?)').run(run_id, level, message),
  forRun: (run_id) => db.prepare('SELECT * FROM run_logs WHERE run_id = ? ORDER BY id ASC').all(run_id),
};

const members = {
  bulkInsert: (run_id, list) => {
    const stmt = db.prepare('INSERT INTO members (run_id,fb_name,profile_url) VALUES (?,?,?)');
    const insertMany = db.transaction((items) => {
      for (const m of items) stmt.run(run_id, m.name, m.profileUrl);
    });
    insertMany(list);
  },
  pending: (run_id) => db.prepare("SELECT * FROM members WHERE run_id=? AND dm_status='pending'").all(run_id),
  setStatus: (id, status) => {
    const now = status === 'sent' ? "datetime('now','localtime')" : 'NULL';
    db.prepare(`UPDATE members SET dm_status=?, sent_at=${now} WHERE id=?`).run(status, id);
  },
  forRun: (run_id) => db.prepare('SELECT * FROM members WHERE run_id=? ORDER BY id ASC').all(run_id),
};

module.exports = { scenarios, runs, logs, members };
