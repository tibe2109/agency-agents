const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Use the system's default Chrome User Data Directory to use existing login
// WARN: User must close all Chrome windows before running script unless using CDP
const USER_DATA_DIR = 'C:\\Users\\Hoang Anh-PC\\AppData\\Local\\Google\\Chrome\\User Data';
let _context = null;

const humanDelay = (min = 1000, max = 3000) =>
  new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

async function getContext() {
  if (_context) return _context;

  // 1. Try connecting to an existing Chrome instance on port 9222 (Debugging port)
  // This allows the user to keep their browser open.
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
     console.log('ℹ️ Attempting to launch new instance (Fallback)...');
  }

  // 2. Launch new instance
  console.log(`📂 Loading SYSTEM Chrome Profile from: ${USER_DATA_DIR}`);
  console.log('⚠️ IMPORTANT: If not using port 9222, Please CLOSE ALL CHROME WINDOWS before proceeding!');

  try {
      // Check if Chrome processes are running and warn/kill
      try {
        const encoding = 'utf8';
        const running = execSync('tasklist /FI "IMAGENAME eq chrome.exe" /NH', { encoding });
        if (running.includes('chrome.exe')) {
             console.log('⚠️ Chrome is running. Attempting to launch anyway (might fail if profile locked)...');
             // Optionally: execSync('taskkill /F /IM chrome.exe /T'); 
        }
      } catch (e) { /* ignore */ }

      _context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use real Chrome
        // channel: 'chrome', // Removed to avoid potential conflicts with executablePath
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--window-position=0,0',
          '--ignore-certificate-errors',
          '--remote-debugging-port=9222', // Enable port for future connections
          // '--profile-directory=Default' // Uncomment if specific profile needed, otherwise uses last used
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
    await _context.close();
    _context = null;
  }
}

module.exports = { getContext, closeBrowser, humanDelay };
