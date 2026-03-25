const { getContext, humanDelay } = require('./browser');

/**
 * Lấy danh sách thành viên trong group Facebook.
 * @param {string} groupUrl - URL group FB (vd: https://www.facebook.com/groups/xxx)
 * @param {number} maxMembers - Số thành viên tối đa cần lấy (default: 50)
 * @param {Function} log
 */
async function getGroupMembers(groupUrl, maxMembers = 50, log = console.log) {
  const context = await getContext();
  const page = await context.newPage();

  try {
    // Lấy group ID từ URL
    const groupId = groupUrl.match(/facebook\.com\/groups\/([^/?]+)/)?.[1];
    if (!groupId) throw new Error('URL group không hợp lệ');

    const membersUrl = `https://www.facebook.com/groups/${groupId}/members`;
    log(`Đang truy cập danh sách thành viên: ${membersUrl}`);

    await page.goto(membersUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await humanDelay(3000, 5000);

    const members = [];
    let prevCount = 0;
    let stableRounds = 0;

    log('Đang scroll để load danh sách...');

    while (members.length < maxMembers && stableRounds < 4) {
      // Extract members hiện có trên trang
      const extracted = await page.evaluate(() => {
        const results = [];
        // Các selector phổ biến cho member list
        const selectors = [
          'a[href*="/user/"]',
          'a[href*="facebook.com/profile.php"]',
          'a[aria-label][href*="facebook.com"]',
        ];

        const seen = new Set();
        for (const sel of selectors) {
          document.querySelectorAll(sel).forEach(el => {
            const href = el.href || '';
            const name = el.innerText?.trim() || el.getAttribute('aria-label') || '';

            // Lọc: phải có tên, phải là profile link, không trùng
            if (
              name &&
              name.length > 1 &&
              name.length < 100 &&
              (href.includes('/user/') || href.includes('profile.php')) &&
              !seen.has(href)
            ) {
              seen.add(href);
              results.push({ name, profileUrl: href });
            }
          });
        }
        return results;
      });

      // Merge vào danh sách chính
      for (const m of extracted) {
        if (!members.find(x => x.profileUrl === m.profileUrl)) {
          members.push(m);
        }
      }

      log(`Đã tìm được ${members.length} thành viên...`);

      if (members.length >= maxMembers) break;

      // Kiểm tra stable (không tăng thêm)
      if (members.length === prevCount) {
        stableRounds++;
      } else {
        stableRounds = 0;
        prevCount = members.length;
      }

      // Scroll xuống
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await humanDelay(2000, 4000);
    }

    log(`✅ Hoàn tất: ${members.length} thành viên`, 'success');
    return members.slice(0, maxMembers);
  } catch (err) {
    log(`❌ Lỗi scrape member: ${err.message}`, 'error');
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Gửi tin nhắn DM đến một thành viên qua Facebook Messenger.
 * @param {string} profileUrl - URL profile FB của người nhận
 * @param {string} message - Nội dung tin nhắn
 * @param {Function} log
 */
async function sendDM(profileUrl, message, log = console.log) {
  const context = await getContext();
  const page = await context.newPage();

  try {
    log(`Đang mở profile: ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await humanDelay(2000, 3000);

    // Tìm nút "Nhắn tin" / "Message"
    const msgBtnSelectors = [
      '[aria-label="Nhắn tin"]',
      '[aria-label="Message"]',
      'a[href*="messenger.com/t/"]',
      'div[role="button"]:has-text("Nhắn tin")',
      'div[role="button"]:has-text("Message")',
    ];

    let msgBtn = null;
    for (const sel of msgBtnSelectors) {
      try {
        msgBtn = await page.$(sel);
        if (msgBtn) break;
      } catch {}
    }

    if (!msgBtn) throw new Error('Không tìm thấy nút Nhắn tin trên profile');

    await msgBtn.click();
    await humanDelay(2000, 3000);

    // Tìm ô nhập tin nhắn trong Messenger
    const inputSelectors = [
      '[aria-label="Aa"]',
      '[contenteditable="true"][role="textbox"]',
      'div[data-lexical-editor="true"]',
    ];

    let inputBox = null;
    for (const sel of inputSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 8000 });
        inputBox = await page.$(sel);
        if (inputBox) break;
      } catch {}
    }

    if (!inputBox) throw new Error('Không tìm thấy ô nhập tin nhắn Messenger');

    // Gõ tin nhắn
    await inputBox.click();
    await humanDelay(800, 1500);

    for (const char of message) {
      await page.keyboard.type(char, { delay: 30 + Math.random() * 60 });
    }

    await humanDelay(1000, 2000);
    await page.keyboard.press('Enter');
    await humanDelay(2000, 3000);

    log(`✅ Đã gửi DM`, 'success');
    return { success: true };
  } catch (err) {
    log(`❌ Lỗi gửi DM: ${err.message}`, 'error');
    return { success: false, error: err.message };
  } finally {
    await page.close();
  }
}

module.exports = { getGroupMembers, sendDM };
