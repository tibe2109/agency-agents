require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const db = require('./db/index');
const { hasSession } = require('./playwright/browser');
const { commentOnPost } = require('./playwright/commenter');
const { getGroupMembers, sendDM } = require('./playwright/messenger');
const { generateComment, generateDM } = require('./ai/generator');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Upload ảnh
const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh'));
  },
});

// ─── SSE: Real-time log streaming ─────────────────────────────────────────────
const sseClients = new Map(); // runId → [res, ...]

function sendSSE(runId, data) {
  const clients = sseClients.get(runId) || [];
  clients.forEach(res => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

app.get('/api/runs/:id/stream', (req, res) => {
  const { id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(id)) sseClients.set(id, []);
  sseClients.get(id).push(res);

  // Gửi logs cũ ngay khi connect
  const oldLogs = db.logs.forRun(id);
  oldLogs.forEach(l => res.write(`data: ${JSON.stringify({ level: l.level, message: l.message })}\n\n`));

  req.on('close', () => {
    const arr = sseClients.get(id) || [];
    sseClients.set(id, arr.filter(r => r !== res));
  });
});

// ─── Session ──────────────────────────────────────────────────────────────────
app.get('/api/session/status', (req, res) => {
  res.json({ hasSession: hasSession() });
});

// ─── Scenarios ────────────────────────────────────────────────────────────────
app.get('/api/scenarios', (req, res) => {
  res.json(db.scenarios.list().map(s => ({ ...s, steps: JSON.parse(s.steps) })));
});

app.post('/api/scenarios', (req, res) => {
  const { name, description, steps } = req.body;
  if (!name || !steps?.length) return res.status(400).json({ error: 'Thiếu name hoặc steps' });
  const id = uuidv4();
  db.scenarios.create({ id, name, description: description || '', steps: JSON.stringify(steps) });
  res.json({ id, name, description, steps });
});

app.put('/api/scenarios/:id', (req, res) => {
  const { name, description, steps } = req.body;
  db.scenarios.update({ id: req.params.id, name, description, steps: JSON.stringify(steps) });
  res.json({ success: true });
});

app.delete('/api/scenarios/:id', (req, res) => {
  db.scenarios.delete(req.params.id);
  res.json({ success: true });
});

// ─── Upload ảnh ───────────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file' });
  // Đổi tên file với extension gốc
  const ext = path.extname(req.file.originalname);
  const newName = req.file.filename + ext;
  const newPath = path.join(req.file.destination, newName);
  fs.renameSync(req.file.path, newPath);
  res.json({ filename: newName, url: `/uploads/${newName}` });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Runs ─────────────────────────────────────────────────────────────────────
app.get('/api/runs', (req, res) => {
  res.json(db.runs.list());
});

// ── Run: Comment theo kịch bản ────────────────────────────────────────────────
app.post('/api/run/comment', async (req, res) => {
  const { post_url, scenario_id } = req.body;
  if (!post_url) return res.status(400).json({ error: 'Thiếu post_url' });
  if (!hasSession()) return res.status(400).json({ error: 'Chưa setup session Facebook. Chạy: npm run setup-session' });

  const scenario = scenario_id ? db.scenarios.get(scenario_id) : null;
  if (scenario_id && !scenario) return res.status(404).json({ error: 'Không tìm thấy kịch bản' });

  const runId = uuidv4();
  db.runs.create({ id: runId, post_url, scenario_id: scenario_id || null, mode: 'comment' });
  res.json({ runId });

  // Chạy async
  runCommentJob(runId, post_url, scenario).catch(console.error);
});

async function runCommentJob(runId, postUrl, scenario) {
  const log = (message, level = 'info') => {
    db.logs.add(runId, message, level);
    sendSSE(runId, { level, message });
    console.log(`[${level.toUpperCase()}] ${message}`);
  };

  db.runs.setStatus(runId, 'running');
  log(`▶️ Bắt đầu chạy kịch bản cho bài viết: ${postUrl}`);

  try {
    if (!scenario) {
      // Không có kịch bản: comment một lần với AI
      const text = await generateComment('Bài viết rất hay, mình rất thích!', postUrl);
      await commentOnPost(postUrl, text, null, log);
    } else {
      const steps = JSON.parse(scenario.steps);
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        log(`📝 Bước ${i + 1}/${steps.length}: ${step.description || 'Comment'}`);

        // Delay trước khi thực hiện bước
        if (step.delay_seconds > 0) {
          log(`⏱️ Chờ ${step.delay_seconds} giây...`);
          await new Promise(r => setTimeout(r, step.delay_seconds * 1000));
        }

        // Tạo nội dung: AI generate hoặc dùng template trực tiếp
        let text = step.text;
        if (step.use_ai && text) {
          log('🤖 AI đang tạo nội dung...');
          text = await generateComment(text, postUrl, step.context || '');
          log(`💬 Nội dung: "${text}"`);
        }

        // Đường dẫn ảnh
        const imagePath = step.image_filename
          ? path.join(__dirname, '../uploads', step.image_filename)
          : null;

        if (imagePath && !require('fs').existsSync(imagePath)) {
          log(`⚠️ File ảnh không tồn tại: ${step.image_filename}`, 'warn');
        }

        const result = await commentOnPost(postUrl, text, imagePath || null, log);

        if (!result.success) {
          log(`❌ Bước ${i + 1} thất bại: ${result.error}`, 'error');
        }
      }
    }

    db.runs.setStatus(runId, 'done');
    log('🎉 Hoàn tất tất cả bước!', 'success');
  } catch (err) {
    db.runs.setStatus(runId, 'error');
    log(`❌ Lỗi nghiêm trọng: ${err.message}`, 'error');
  }
}

// ── Run: DM thành viên ────────────────────────────────────────────────────────
app.post('/api/run/dm', async (req, res) => {
  const { post_url, group_url, message_template, max_members = 20 } = req.body;
  if (!post_url || !group_url) return res.status(400).json({ error: 'Thiếu post_url hoặc group_url' });
  if (!hasSession()) return res.status(400).json({ error: 'Chưa setup session Facebook' });

  const runId = uuidv4();
  db.runs.create({ id: runId, post_url, scenario_id: null, mode: 'dm' });
  res.json({ runId });

  runDMJob(runId, post_url, group_url, message_template, max_members).catch(console.error);
});

async function runDMJob(runId, postUrl, groupUrl, template, maxMembers) {
  const log = (message, level = 'info') => {
    db.logs.add(runId, message, level);
    sendSSE(runId, { level, message });
  };

  db.runs.setStatus(runId, 'running');
  log(`▶️ Bắt đầu lấy danh sách thành viên group: ${groupUrl}`);

  try {
    // Phase 1: Lấy member list
    const members = await getGroupMembers(groupUrl, maxMembers, log);
    if (!members.length) throw new Error('Không lấy được danh sách thành viên');

    db.members.bulkInsert(runId, members);
    log(`📋 Đã lưu ${members.length} thành viên`, 'success');

    // Phase 2: Gửi DM
    const pending = db.members.pending(runId);
    log(`📨 Bắt đầu gửi ${pending.length} tin nhắn (tối đa 10/ngày)`);

    const dailyLimit = Math.min(pending.length, 10);

    for (let i = 0; i < dailyLimit; i++) {
      const member = pending[i];
      log(`[${i + 1}/${dailyLimit}] Nhắn tin tới: ${member.fb_name}`);

      // AI tạo tin nhắn
      const msg = template
        ? await generateDM(member.fb_name, postUrl, template)
        : await generateDM(member.fb_name, postUrl, 'Nhờ anh/chị ghé xem bài viết và cho ý kiến nhé!');

      log(`💬 Nội dung: "${msg.substring(0, 60)}..."`);

      const result = await sendDM(member.profile_url, msg, log);
      db.members.setStatus(member.id, result.success ? 'sent' : 'failed');

      if (i < dailyLimit - 1) {
        // Random delay 60-120 giây giữa mỗi tin
        const delay = 60000 + Math.random() * 60000;
        log(`⏱️ Chờ ${Math.round(delay / 1000)}s trước tin tiếp theo...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    db.runs.setStatus(runId, 'done');
    log(`🎉 Hoàn tất! Đã gửi ${dailyLimit} tin nhắn.`, 'success');
  } catch (err) {
    db.runs.setStatus(runId, 'error');
    log(`❌ Lỗi: ${err.message}`, 'error');
  }
}

// ─── Run logs ─────────────────────────────────────────────────────────────────
app.get('/api/runs/:id/logs', (req, res) => {
  res.json(db.logs.forRun(req.params.id));
});

app.get('/api/runs/:id/members', (req, res) => {
  res.json(db.members.forRun(req.params.id));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
  console.log(`   Session FB: ${hasSession() ? '✅ Đã có' : '❌ Chưa setup (chạy: npm run setup-session)'}`);
});
