const { chromium } = require('playwright');
const path = require('path');

// Reuse a stable dedicated profile so Gemini login persists across runs.
// Profile can be selected at runtime via GEMINI_PROFILE_NAME (e.g. gemini_profile_data_acc2).
const PROFILE_NAME = process.env.GEMINI_PROFILE_NAME || 'gemini_profile_data';
const USER_DATA_DIR = path.resolve(__dirname, `../${PROFILE_NAME}`);
let _context = null;
let _connectedViaCdp = false;

const humanDelay = (min = 1000, max = 3000) =>
  new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

async function getContext() {
  if (_context) return _context;
  const forceCdp = process.env.GEMINI_FORCE_CDP === '1';
  const disableCdp = process.env.GEMINI_DISABLE_CDP === '1';

  // 1. Try connecting to an existing Chrome instance on port 9222 (Debugging port)
  // This allows the user to keep their browser open.
  if (!disableCdp) {
    try {
      console.log('🔌 Attempting to connect to existing Chrome (Port 9222)...');
      // Retry a few times in case browser is starting up
      for (let i = 0; i < 5; i++) {
          try {
              // Try 127.0.0.1 which is sometimes more reliable on Windows than localhost
              const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
              console.log('✅ Connected to existing Chrome instance!');
              // connectOverCDP returns a Browser, we need a Context
              const contexts = browser.contexts();
              if (contexts.length > 0) {
                  _context = contexts[0];
              } else {
                  _context = await browser.newContext();
              }
              _connectedViaCdp = true;
              return _context;
          } catch (e) {
               console.log(`   Connection attempt ${i+1} failed: ${e.message}`);
               if (i < 4) await new Promise(r => setTimeout(r, 1000));
          }
      }
      // If loop finishes without return, it failed.
      throw new Error('Connection failed after 5 attempts');
    } catch (e) {
      console.error(`⚠️ Could not connect to existing Chrome (Port 9222): ${e.message}`);
        if (forceCdp) {
         throw new Error('CDP connection failed. Please keep the manual Chrome window opened by start_manual_mode.ps1 and try again.');
        }
        console.log('ℹ️ Attempting to launch new instance (Fallback)...');
    }
  } else {
    console.log('ℹ️ GEMINI_DISABLE_CDP=1, skipping CDP connection and launching persistent profile directly.');
  }

  // 2. Launch new instance with dedicated profile (no shared-profile lock issues)
  console.log(`📂 Loading AUTOMATION Chrome Profile from: ${USER_DATA_DIR}`);

  try {
      _context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use real Chrome
        ignoreDefaultArgs: ['--enable-automation'],
        // channel: 'chrome', // Removed to avoid potential conflicts with executablePath
        args: [
          '--window-position=0,0',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-sync',
          '--disable-features=ChromeSigninIntercept,SigninPromo'
        ],
        viewport: null, // Let Chrome decide window size or restore last session
        locale: 'vi-VN',
      });
  } catch (e) {
      console.error('❌ Failed to launch Chrome. Is it already running?');
      console.error('👉 Error:', e.message);
      console.error('💡 TIP: Run prompt "Close Chrome" to force close open windows.');
      throw e;
  }

  return _context;
}

async function closeBrowser() {
  if (_context) {
    // If context came from connectOverCDP, do not close it to avoid disrupting the logged-in browser session.
    if (!_connectedViaCdp) {
      await _context.close();
    }
    _context = null;
    _connectedViaCdp = false;
  }
}

module.exports = { getContext, closeBrowser, humanDelay };
