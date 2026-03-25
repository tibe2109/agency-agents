/**
 * Chạy file này MỘT LẦN để login Facebook thủ công và lưu session:
 *   node src/playwright/session.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { chromium } = require('playwright');
const path = require('path');

const SESSION_PATH = path.join(__dirname, '../../sessions/fb_session.json');

async function saveSession() {
  console.log('🚀 Mở trình duyệt... Hãy đăng nhập Facebook thủ công.');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });

  const page = await context.newPage();
  await page.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded' });

  console.log('\n⏳ Đăng nhập xong thì nhấn ENTER tại terminal này...\n');
  await new Promise((resolve) => {
    process.stdin.setRawMode(false);
    process.stdin.resume();
    process.stdin.once('data', resolve);
  });

  // Lưu session (cookies + localStorage)
  await context.storageState({ path: SESSION_PATH });
  console.log(`✅ Session đã lưu tại: ${SESSION_PATH}`);

  await browser.close();
  process.exit(0);
}

saveSession().catch((e) => {
  console.error('❌ Lỗi:', e.message);
  process.exit(1);
});
