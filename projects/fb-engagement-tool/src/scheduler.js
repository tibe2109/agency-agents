/**
 * Background Scheduler cho FB Engagement Tool
 * Chạy độc lập từ web server, trigger các job tự động theo cron schedule
 *
 * Dùng: node src/scheduler.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const cron = require('node-cron');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load config từ file
let CONFIG;
const configPath = path.join(__dirname, '../config.json');
const configExamplePath = path.join(__dirname, '../config.json.example');

if (fs.existsSync(configPath)) {
  CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} else {
  console.warn(`⚠️  config.json không tìm thấy!\n`);
  console.log(`   1. Copy từ mẫu: cp config.json.example config.json`);
  console.log(`   2. Sửa config.json với URL Facebook của bạn`);
  console.log(`   3. Chạy lại: npm run scheduler\n`);
  process.exit(1);
}

const API_BASE = 'http://localhost:3000/api';

/**
 * Trigger job qua API
 */
async function triggerCommentJob(config) {
  try {
    console.log(`[${new Date().toLocaleTimeString('vi-VN')}] 🚀 Trigger Comment Job...`);
    const r = await fetch(`${API_BASE}/run/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).then(r => r.json());

    if (r.error) {
      console.error(`   ❌ Error: ${r.error}`);
      return false;
    }

    console.log(`   ✅ Job started: ${r.runId}`);
    return true;
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function triggerDMJob(config) {
  try {
    console.log(`[${new Date().toLocaleTimeString('vi-VN')}] 🚀 Trigger DM Job...`);
    const r = await fetch(`${API_BASE}/run/dm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).then(r => r.json());

    if (r.error) {
      console.error(`   ❌ Error: ${r.error}`);
      return false;
    }

    console.log(`   ✅ Job started: ${r.runId}`);
    return true;
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

/**
 * Setup cron jobs
 */
function setupScheduler() {
  console.log('\n📋 FB Engagement Tool - Scheduler');
  console.log('═'.repeat(50));

  // Check config
  const hasValidComment =
    CONFIG.comment.enabled &&
    CONFIG.comment.config.post_url &&
    !CONFIG.comment.config.post_url.includes('YOUR_');

  const hasValidDM =
    CONFIG.dm.enabled &&
    CONFIG.dm.config.post_url &&
    CONFIG.dm.config.group_url &&
    !CONFIG.dm.config.post_url.includes('YOUR_') &&
    !CONFIG.dm.config.group_url.includes('YOUR_');

  if (!hasValidComment && !hasValidDM) {
    console.error('\n❌ CONFIG CHƯA SETUP!');
    console.error('   Sửa file: config.json hoặc chỉnh CONFIG trong scheduler.js');
    console.error('   Cần cung cấp: post_url, group_url, ...');
    return;
  }

  console.log('\n⏰ Jobs được setup:\n');

  if (hasValidComment) {
    console.log(`✅ Comment: ${CONFIG.comment.schedule}`);
    if (CONFIG.comment.description) console.log(`   ${CONFIG.comment.description}`);
    console.log(`   Post: ${CONFIG.comment.config.post_url.substring(0, 60)}...`);
    console.log(`   Mode: ${CONFIG.comment.config.scenario_id ? 'Kịch bản #' + CONFIG.comment.config.scenario_id : 'AI tự tạo'}\n`);

    cron.schedule(CONFIG.comment.schedule, () => {
      triggerCommentJob(CONFIG.comment.config);
    });
  }

  if (hasValidDM) {
    console.log(`✅ DM: ${CONFIG.dm.schedule}`);
    if (CONFIG.dm.description) console.log(`   ${CONFIG.dm.description}`);
    console.log(`   Post: ${CONFIG.dm.config.post_url.substring(0, 60)}...`);
    console.log(`   Group: ${CONFIG.dm.config.group_url.substring(0, 60)}...`);
    console.log(`   Max members/run: ${CONFIG.dm.config.max_members}\n`);

    cron.schedule(CONFIG.dm.schedule, () => {
      triggerDMJob(CONFIG.dm.config);
    });
  }

  console.log('═'.repeat(50));
  console.log('⏳ Scheduler running... (Ctrl+C để dừng)\n');
}

// ─── Main ─────────────────────────────────────────────────────────
setupScheduler();
