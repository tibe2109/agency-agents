const { getContext, humanDelay, closeBrowser } = require('./browser');
const fs = require('fs');
const path = require('path');

/**
 * Generate image using Gemini
 * @param {string} prompt - The prompt to generate
 * @param {string} outputDir - Directory to save the image
 */
async function generateImage(prompt, outputDir) {
  const context = await getContext();
  let page;
  
  if (context.pages().length > 0) {
      page = context.pages()[0];
  } else {
      page = await context.newPage();
  }

  try {
      console.log('🔗 Navigating to Gemini...');
      await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Check if login is needed
      if (page.url().includes('accounts.google.com')) {
          console.log('⚠️ Please login to Google account in the browser window!');
          // Wait indefinitely for user to login and redirect back
          await page.waitForURL('https://gemini.google.com/app', { timeout: 0 });
          console.log('✅ Login detected!');
          await page.waitForTimeout(3000);
      }

      // 1. Click "Tạo hình ảnh" button if visible (Start new chat or functionality)
      // User provided: <button aria-label="🖼️ Tạo hình ảnh, nút, nhấn để dùng công cụ">
      const createImgBtnSelector = 'button[aria-label*="Tạo hình ảnh"], button .card-label:has-text("Tạo hình ảnh")';
      try {
          const createBtn = page.locator(createImgBtnSelector).first();
          if (await createBtn.isVisible({ timeout: 5000 })) {
             console.log('🖱️ Clicking "Create Image" button...');
             await createBtn.click();
             await page.waitForTimeout(2000);
          }
      } catch(e) {
          console.log('ℹ️ "Create Image" button not found or not needed.');
      }

      // 2. Enter Prompt
      console.log('✍️ Entering prompt...');
      
      // Update selectors based on user HTML
      // The aria-label is on the <rich-textarea>, the contenteditable is the child <div>
      const inputSelectors = [
          'rich-textarea[aria-label="Nhập câu lệnh cho Gemini"] > div.ql-editor', // Precise parent-child
          'rich-textarea > div.ql-editor', // Less specific parent
          'div.ql-editor[contenteditable="true"]', // Class based
          'div[role="textbox"]', // Generic
          'div.ql-editor > p' // Deepest element inside editor
      ];
      
      let inputFound = false;
      let inputLocator = null;
      
      for (const sel of inputSelectors) {
          try {
              inputLocator = page.locator(sel).first();
              // Wait a tiny bit to be sure
              if (await inputLocator.count() > 0 && await inputLocator.isVisible()) {
                  console.log(`🖱️ Found input using: ${sel}`);
                  // Click to focus
                  await inputLocator.click({ force: true });
                  await page.waitForTimeout(500); // Wait for focus to settle
                  
                  // Clear existing content safely
                  try {
                      await inputLocator.focus();
                      await page.keyboard.press('Control+A');
                      await page.keyboard.press('Backspace');
                  } catch (e) {
                       console.log('⚠️ Failed to clear input, proceeding anyway...');
                  }
                  
                  await page.waitForTimeout(200);

                  // Type prompt character by character to trigger events
                  console.log(`Typing prompt (${prompt.length} chars)...`);
                  await page.keyboard.type(prompt, { delay: 5 }); 
                  
                  // Verification: Check if text is entered
                  // Wait a moment for UI update
                  await page.waitForTimeout(500);
                  
                  // Check the text content of the editor div
                  // Note: content might be in <p> tags inside editor
                  const editorElement = page.locator('div.ql-editor').first();
                  const editorContent = await editorElement.textContent();
                  
                  if (editorContent && editorContent.trim().length > 0) {
                      inputFound = true;
                      console.log('✅ Text entered successfully.');
                      break;
                  } else {
                      console.log('⚠️ Text entry verification failed (empty content). Retrying...');
                  }
              }
          } catch(e) {
              // Ignore specific selector error and try next
              // console.log(`Selector ${sel} failed: ${e.message}`);
          }
      }
      
      if (!inputFound) {
          console.error("❌ Could not find or type into input box.");
          // Debug: print available input-like elements
          const inputs = await page.locator('div[contenteditable="true"]').count();
          console.log(`Found ${inputs} contenteditable divs on page.`);
          throw new Error("Input box not found");
      }

      // 3. Click Send
      console.log('🚀 Sending prompt...');
      // User HTML: button with aria-label="Gửi tin nhắn" and mat-icon send
      const sendBtnSelector = 'button[aria-label="Gửi tin nhắn"]';
      const sendBtn = page.locator(sendBtnSelector).first();
      
      // Wait for button to be enabled (aria-disabled="false")
      try {
          await sendBtn.waitFor({ state: 'visible', timeout: 5000 });
          // Check if disabled
          const isDisabled = await sendBtn.getAttribute('aria-disabled') === 'true';
          if (isDisabled) {
              console.log('⚠️ Send button is disabled. Prompt might be empty?');
              // Try typing a space to trigger
              await inputLocator.type(' ');
              await page.waitForTimeout(500);
          }
          await sendBtn.click();
      } catch (e) {
          console.log('⚠️ Could not click send button directly. Trying icon selector...');
          await page.locator('mat-icon[data-mat-icon-name="send"]').click();
      }
      
      // 4. Wait for generation
      console.log('⏳ Waiting for generation (this may take 10-20s)...');
      
      // We wait for the "Download" button to appear.
      // User provided: button[data-test-id="download-generated-image-button"]
      // or button[aria-label="Tải hình ảnh có kích thước đầy đủ xuống"]
      const downloadSelector = 'button[data-test-id="download-generated-image-button"], button[aria-label="Tải hình ảnh có kích thước đầy đủ xuống"]';
      
      // Wait up to 60s for the button
      const downloadBtn = page.locator(downloadSelector).first();
      await downloadBtn.waitFor({ state: 'visible', timeout: 60000 });
      console.log('✅ Image generated! Finding download button...');

      // 5. Download
      console.log('⬇️ Downloading image...');
      
      // Start waiting for download before clicking. 
      // Note: If clicking opens a new tab or triggers download, this Promise will resolve.
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      
      await downloadBtn.click();
      
      const download = await downloadPromise;
      const suggestedName = download.suggestedFilename();
      const savePath = path.join(outputDir, suggestedName);
      
      await download.saveAs(savePath);
      console.log(`✅ Image saved to: ${savePath}`);
      return savePath;

  } catch (err) {
      console.error('❌ Error generating image:', err);
      // Screenshot for debug
      const errorShot = path.join(__dirname, '../error_gen.png');
      await page.screenshot({ path: errorShot });
      console.log(`📸 Saved error screenshot to: ${errorShot}`);
      throw err;
  }
}

// Minimal runner if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log("Usage: node generator.js '<prompt>'");
    } else {
        const prompt = args[0];
        const outDir = path.resolve(__dirname, '../output');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
        generateImage(prompt, outDir).catch(console.error).finally(() => closeBrowser());
    }
}

module.exports = { generateImage };
