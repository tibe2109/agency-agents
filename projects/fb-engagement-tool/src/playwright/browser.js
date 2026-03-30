const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Sử dụng folder profile riêng biệt trong project để lưu giữ mọi thứ (cookies, cache, login)
// Thay vì chỉ lưu file json session
const USER_DATA_DIR = path.join(__dirname, '../../fb_profile_data');
const STORAGE_STATE_PATH = path.join(__dirname, '../../sessions/fb_session.json');

let _context = null;
let _browser = null;

async function launchContext() {
  const launchOptions = {
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-acceleration',
      '--disable-gpu',
      // '--start-maximized' // Optional
    ],
    viewport: { width: 1280, height: 800 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  };

  try {
    return await chromium.launchPersistentContext(USER_DATA_DIR, {
      ...launchOptions,
      channel: 'chrome', // Ưu tiên Google Chrome thật
    });
  } catch (e) {
    console.warn(`⚠️ System Chrome launch failed, fallback to Playwright Chromium: ${e.message}`);
    try {
      return await chromium.launchPersistentContext(USER_DATA_DIR, launchOptions);
    } catch (e2) {
      console.warn(`⚠️ Persistent profile launch failed, fallback to storageState context: ${e2.message}`);

      _browser = await chromium.launch({
        headless: false,
        args: launchOptions.args,
      });

      const contextOptions = {
        viewport: launchOptions.viewport,
        locale: launchOptions.locale,
        timezoneId: launchOptions.timezoneId,
        userAgent: launchOptions.userAgent,
      };

      if (fs.existsSync(STORAGE_STATE_PATH)) {
        contextOptions.storageState = STORAGE_STATE_PATH;
      }

      return _browser.newContext(contextOptions);
    }
  }
}

// Human-like random delay
const humanDelay = (min = 1000, max = 3000) =>
  new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

// Human-like typing with random delay per character
async function humanType(page, selector, text) {
  await page.click(selector);
  await humanDelay(500, 1000);
  for (const char of text) {
    await page.keyboard.type(char, { delay: 40 + Math.random() * 80 });
  }
}

// Kiểm tra xem đã có profile data chưa
function hasSession() {
  return fs.existsSync(USER_DATA_DIR);
}

async function getContext() {
  if (_context) {
    try {
      // Touch context to ensure it is still usable.
      _context.pages();
      return _context;
    } catch (e) {
      _context = null;
    }
  }

  console.log(`📂 Loading Browser Profile from: ${USER_DATA_DIR}`);

  // launchPersistentContext: Mở trình duyệt với profile cố định
  // Tương tự như việc mở Chrome với một User Profile cụ thể
  try {
    _context = await launchContext();
  } catch (e) {
    console.warn(`⚠️ Launch context failed, retrying once: ${e.message}`);
    await new Promise(r => setTimeout(r, 1500));
    _context = await launchContext();
  }

  return _context;
}

async function closeBrowser() {
  if (_context) {
    await _context.close();
    _context = null;
  }
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

// Giữ lại getBrowser để tương thích ngược nếu cần, nhưng trỏ về context
async function getBrowser() {
  if (_browser) {
    return _browser;
  }

  // Persistent context không expose browser instance theo cách cũ dễ dàng.
    return {
        isConnected: () => !!_context,
        close: closeBrowser
    };
}

module.exports = { getBrowser, getContext, closeBrowser, hasSession, humanDelay, humanType };
