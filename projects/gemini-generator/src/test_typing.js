const { chromium } = require('playwright');

async function testTyping() {
  console.log('🔌 Connecting to Chrome on port 9222...');
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
  } catch(e) {
    try {
        browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    } catch(e2) {
        console.error("❌ Could not connect to Chrome. Make sure you ran the manual mode script successfully first (or launched Chrome with --remote-debugging-port=9222).");
        return;
    }
  }
  
  const contexts = browser.contexts();
  if (contexts.length === 0) {
      console.error("❌ No browser contexts found.");
      return;
  }
  const context = contexts[0];
  const pages = context.pages();
  
  // Find the Gemini tab
  let page = pages.find(p => p.url().includes('gemini.google.com'));
  if (!page) {
      console.log("⚠️ gemini.google.com tab not found, using the first active tab...");
      page = pages[0];
  }
  
  console.log(`🔗 Attached to page: ${page.url()}`);
  
  // Selectors to try based on user's HTML
  const selectors = [
      'div.ql-editor.textarea', // Most specific class combo from user HTML
      'div[contenteditable="true"][role="textbox"]',
      'rich-textarea > div.ql-editor',
      'div[aria-label="Nhập câu lệnh cho Gemini"]',
      'rich-textarea' // If we click this, maybe it focuses child?
  ];
  
  console.log("--- STARTING SELECTOR TEST ---");
  
  for (const sel of selectors) {
      console.log(`\n🔍 Testing selector: "${sel}"`);
      try {
          const loc = page.locator(sel).first();
          const count = await loc.count();
          
          if (count > 0) {
              const isVisible = await loc.isVisible();
              console.log(`   ✅ Matched ${count} element(s). Visible: ${isVisible}`);
              
              if (isVisible) {
                  // 1. Highlight it so user can see what we found
                  await loc.evaluate(el => el.style.border = "5px solid red");
                  console.log('   🎨 ACTION: Highlighted with RED BORDER. Do you see it?');
                  
                  // 2. Click
                  await loc.click();
                  console.log('   🖱️ ACTION: Clicked.');
                  await page.waitForTimeout(500);

                  // 3. Type
                  const textToType = `TESTING SELECTOR: ${sel}`;
                  console.log(`   ⌨️ ACTION: Typing "${textToType}"...`);
                  
                  // Clear first just in case
                  await page.keyboard.press('Control+A');
                  await page.keyboard.press('Backspace');
                  
                  await page.keyboard.type(textToType, { delay: 50 });
                  
                  // Check if text appeared
                  const val = await loc.textContent();
                  console.log(`   👀 READBACK: "${val?.trim()}"`);
                  
                  if (val && val.includes("TESTING")) {
                      console.log("   🎉 SUCCESS: Text entry worked!");
                      // breaking? No, let's keep testing if user wants, but usually we break.
                      // Let's break to stop messing with it if it worked.
                      break;
                  }
              }
          } else {
              console.log('   ❌ Not found (Count: 0).');
          }
      } catch (e) {
          console.log(`   ❌ Error testing this selector: ${e.message}`);
      }
  }
  
  console.log("\n--- TEST COMPLETED ---");
  console.log("Check the Chrome window. If you saw typing, the tool is working.");
  
  // Don't close browser, just disconnect
  await browser.close(); 
}

testTyping();