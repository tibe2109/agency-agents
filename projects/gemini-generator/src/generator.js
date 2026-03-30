const { getContext, humanDelay, closeBrowser } = require('./browser');
const fs = require('fs');
const path = require('path');

async function findFirstVisible(page, selectors, timeoutMs = 8000) {
    for (const sel of selectors) {
        try {
            const loc = page.locator(sel).first();
            await loc.waitFor({ state: 'visible', timeout: timeoutMs });
            return { selector: sel, locator: loc };
        } catch (e) {
            // Try next selector.
        }
    }
    return null;
}

function hasCanceledSigninMessage(text) {
    const t = (text || '').toLowerCase();
    return (
        t.includes('request canceled') ||
        t.includes("can't sign in") ||
        t.includes('ban da bi dang xuat') ||
        t.includes('vui long dang nhap')
    );
}

/**
 * Generate image using Gemini
 * @param {string} prompt - The prompt to generate
 * @param {string} outputDir - Directory to save the image
 */
async function generateImage(prompt, outputDir) {
  const context = await getContext();
    const page = await context.newPage();

  try {
            console.log('🔗 Opening Gemini in a new tab...');
            await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2500);

            const pageText = (await page.textContent('body')) || '';
            if (hasCanceledSigninMessage(pageText)) {
                throw new Error('Google session canceled/sign-out detected on Gemini page. Re-login with setup_login_profile.ps1 and reuse the same open Chrome session.');
            }

      // Check if login is needed
      if (page.url().includes('accounts.google.com')) {
                    console.log('⚠️ Login required. Please login once in this browser profile, then return to terminal.');
          // Wait indefinitely for user to login and redirect back
          await page.waitForURL('https://gemini.google.com/app', { timeout: 0 });
          console.log('✅ Login detected!');
          await page.waitForTimeout(3000);
      }

            // 1) Click create image mode/tool if available.
            const createImageMatch = await findFirstVisible(page, [
                'button[aria-label*="Tạo hình ảnh"]',
                'button:has-text("Tạo hình ảnh")',
                'button[aria-label*="Create image"]',
                'button:has-text("Create image")'
            ], 5000);
            if (createImageMatch) {
                console.log(`🖼️ Clicking create-image button via: ${createImageMatch.selector}`);
                await createImageMatch.locator.click({ force: true });
                await page.waitForTimeout(1200);
            } else {
                console.log('ℹ️ Create-image button not found. Continuing with current input mode.');
            }

            // 2) Focus input and paste/enter prompt.
            console.log('✍️ Filling prompt...');
            const inputMatch = await findFirstVisible(page, [
                'div.ql-editor.textarea[contenteditable="true"]',
                'rich-textarea[aria-label="Nhập câu lệnh cho Gemini"] div.ql-editor[contenteditable="true"]',
                'rich-textarea div.ql-editor[contenteditable="true"]',
                'div[role="textbox"][contenteditable="true"]'
            ], 12000);

            if (!inputMatch) {
                const count = await page.locator('div[contenteditable="true"]').count();
                throw new Error(`Input box not found. contenteditable count=${count}`);
            }

            const inputLocator = inputMatch.locator;
            console.log(`⌨️ Using input selector: ${inputMatch.selector}`);
            await inputLocator.click({ force: true });
            await page.waitForTimeout(250);
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');

            let pasted = false;
            try {
                await page.evaluate(async (text) => {
                    await navigator.clipboard.writeText(text);
                }, prompt);
                await page.keyboard.press('Control+V');
                pasted = true;
            } catch (e) {
                // Clipboard can fail due to browser permissions; fallback to typing.
            }

            if (!pasted) {
                await page.keyboard.type(prompt, { delay: 2 });
            }

            await page.waitForTimeout(400);
            const editorText = ((await inputLocator.textContent()) || '').trim();
            if (!editorText) {
                throw new Error('Prompt input appears empty after paste/type');
            }
            console.log('✅ Prompt entered.');

      // 3. Click Send
      console.log('🚀 Sending prompt...');
            const sendMatch = await findFirstVisible(page, [
                'button[aria-label="Gửi tin nhắn"][aria-disabled="false"]',
                'button[aria-label="Send message"][aria-disabled="false"]',
                'button.send-button.submit[aria-disabled="false"]',
                'button:has(mat-icon[fonticon="send"])[aria-disabled="false"]'
            ], 8000);

            if (!sendMatch) {
                throw new Error('Send button not found or still disabled');
            }
            await sendMatch.locator.click({ force: true });

            // 4) Wait fixed 10 seconds, then continue with next prompt.
            console.log('⏳ Sent. Waiting 10 seconds before next tab...');
            await page.waitForTimeout(10000);

            // Return null because this mode is submit-only (no download step).
            return null;

  } catch (err) {
      console.error('❌ Error generating image:', err);
      // Screenshot for debug
      const errorShot = path.join(__dirname, '../error_gen.png');
      await page.screenshot({ path: errorShot });
      console.log(`📸 Saved error screenshot to: ${errorShot}`);
      throw err;
    } finally {
            // Keep only one working tab at a time as requested.
            if (!page.isClosed()) {
                    await page.close();
            }
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
