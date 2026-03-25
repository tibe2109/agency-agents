const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SESSION_PATH = path.join(__dirname, '../../sessions/fb_session.json');

let _browser = null;
let _context = null;

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

function hasSession() {
  return fs.existsSync(SESSION_PATH);
}

async function getBrowser() {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({
      headless: false, // Giữ headless: false để tránh detection
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
      ],
    });
  }
  return _browser;
}

async function getContext() {
  if (_context) {
    try { await _context.pages(); return _context; } catch {}
  }

  const browser = await getBrowser();
  const contextOptions = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  };

  if (hasSession()) {
    contextOptions.storageState = SESSION_PATH;
  }

  _context = await browser.newContext(contextOptions);

  // Stealth: ẩn navigator.webdriver
  await _context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {} };
  });

  return _context;
}

async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
    _context = null;
  }
}

module.exports = { getBrowser, getContext, closeBrowser, hasSession, humanDelay, humanType };
