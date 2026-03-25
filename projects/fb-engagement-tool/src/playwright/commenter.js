const path = require('path');
const { getContext, humanDelay } = require('./browser');

/**
 * Đăng một comment (có thể kèm ảnh) lên bài viết Facebook.
 * @param {string} postUrl    - URL bài viết FB
 * @param {string} text       - Nội dung comment
 * @param {string|null} imagePath - Đường dẫn file ảnh (optional)
 * @param {Function} log      - Callback log(message, level)
 */
async function commentOnPost(postUrl, text, imagePath = null, log = console.log) {
  const context = await getContext();
  const page = await context.newPage();

  try {
    log('Đang mở bài viết...');
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await humanDelay(2000, 4000);

    // Cuộn xuống để bài viết load
    await page.evaluate(() => window.scrollBy(0, 400));
    await humanDelay(1500, 2500);

    // ── Tìm ô comment ────────────────────────────────────────────────────────
    // FB có thể dùng aria-label khác nhau theo ngôn ngữ
    const commentSelectors = [
      '[aria-label="Viết bình luận…"]',
      '[aria-label="Viết bình luận công khai…"]',
      '[aria-label="Write a comment…"]',
      '[aria-label="Write a public comment…"]',
      'div[data-lexical-editor="true"]',
      'div[contenteditable="true"][role="textbox"]',
    ];

    let commentBox = null;
    for (const sel of commentSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        commentBox = await page.$(sel);
        if (commentBox) { log(`Tìm thấy ô comment: ${sel}`); break; }
      } catch {}
    }

    if (!commentBox) throw new Error('Không tìm thấy ô comment. Kiểm tra FB session hoặc selector.');

    // Click vào ô comment để focus
    await commentBox.click();
    await humanDelay(1000, 2000);

    // ── Đính kèm ảnh (nếu có) ────────────────────────────────────────────────
    if (imagePath) {
      log('Đang đính kèm ảnh...');
      // Tìm nút camera trong khu vực comment
      const photoSelectors = [
        '[aria-label="Đính kèm ảnh hoặc video"]',
        '[aria-label="Attach a photo or video"]',
        '[aria-label="Photo/Video"]',
        '[aria-label="Ảnh/Video"]',
      ];

      let photoBtn = null;
      for (const sel of photoSelectors) {
        photoBtn = await page.$(sel);
        if (photoBtn) break;
      }

      if (photoBtn) {
        await photoBtn.click();
        await humanDelay(1000, 2000);

        // File input
        const fileInput = await page.$('input[type="file"][accept*="image"], input[type="file"][accept*="video"]');
        if (fileInput) {
          await fileInput.setInputFiles(imagePath);
          log('Ảnh đã được chọn, chờ upload...');
          await humanDelay(3000, 5000);
        } else {
          log('Không tìm thấy file input, bỏ qua ảnh.', 'warn');
        }
      } else {
        log('Không tìm thấy nút đính kèm ảnh, bỏ qua.', 'warn');
      }

      // Click lại vào ô comment sau khi đính kèm ảnh
      await commentBox.click();
      await humanDelay(500, 1000);
    }

    // ── Gõ nội dung comment ───────────────────────────────────────────────────
    log('Đang nhập nội dung...');
    for (const char of text) {
      await page.keyboard.type(char, { delay: 30 + Math.random() * 70 });
    }
    await humanDelay(1000, 2000);

    // ── Submit ────────────────────────────────────────────────────────────────
    log('Đang đăng comment...');
    await page.keyboard.press('Enter');
    await humanDelay(3000, 5000);

    // Kiểm tra comment đã xuất hiện
    const posted = await page.evaluate((t) => {
      const allText = document.body.innerText;
      return allText.includes(t.substring(0, 20));
    }, text);

    if (posted) {
      log('✅ Comment đã đăng thành công!', 'success');
    } else {
      log('⚠️ Không xác nhận được comment, kiểm tra thủ công.', 'warn');
    }

    return { success: true };
  } catch (err) {
    log(`❌ Lỗi khi comment: ${err.message}`, 'error');

    // Screenshot để debug
    try {
      const ssPath = path.join(__dirname, '../../data/error_screenshot.png');
      await page.screenshot({ path: ssPath, fullPage: false });
      log(`📸 Screenshot lỗi: ${ssPath}`, 'warn');
    } catch {}

    return { success: false, error: err.message };
  } finally {
    await page.close();
  }
}

module.exports = { commentOnPost };
