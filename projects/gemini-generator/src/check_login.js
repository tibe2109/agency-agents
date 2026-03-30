const { getContext, closeBrowser } = require('./browser');

function looksLoggedOut(text) {
  const patterns = [
    /ban da bi dang xuat/i,
    /vui long dang nhap/i,
    /sign in to use gemini/i,
    /you've been signed out/i,
    /khong the dang nhap cho ban/i,
    /trinh duyet hoac ung dung nay co the khong an toan/i,
    /this browser or app may not be secure/i
  ];
  return patterns.some(p => p.test(text));
}

(async () => {
  let page = null;
  try {
    const context = await getContext();
    page = await context.newPage();
    await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const bodyText = ((await page.textContent('body')) || '').toLowerCase();
    const loggedOut = page.url().includes('accounts.google.com') || looksLoggedOut(bodyText);

    if (loggedOut) {
      console.error('LOGIN_INVALID');
      process.exitCode = 1;
    } else {
      console.log('LOGIN_VALID');
    }
  } catch (e) {
    console.error('LOGIN_CHECK_ERROR:', e.message);
    process.exitCode = 1;
  } finally {
    try {
      if (page && !page.isClosed()) await page.close();
    } catch (e) {
      // ignore
    }
    await closeBrowser();
  }
})();
