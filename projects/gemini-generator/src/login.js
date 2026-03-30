const { getContext } = require('./browser');
const readline = require('readline');

function askEnter(message) {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(message, () => {
            rl.close();
            resolve();
        });
    });
}

function looksLoggedOut(text) {
    const patterns = [
        /ban da bi dang xuat/i,
        /vui long dang nhap/i,
        /sign in to use gemini/i,
        /you've been signed out/i
    ];
    return patterns.some(p => p.test(text));
}

(async () => {
    try {
        console.log('Opening Gemini browser for login setup...');
        const context = await getContext();
        const page = await context.newPage();
        await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        console.log('Please login in the opened browser window, then press ENTER here.');
        await askEnter('Press ENTER after login is completed: ');

        await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const bodyText = ((await page.textContent('body')) || '').toLowerCase();
        if (page.url().includes('accounts.google.com') || looksLoggedOut(bodyText)) {
            console.error('LOGIN_CHECK_FAILED: Gemini session is still not logged in.');
            process.exitCode = 1;
        } else {
            console.log('LOGIN_CHECK_OK: Login session saved successfully for this profile.');
        }
    } catch (e) {
        console.error('Login setup failed:', e.message);
        process.exitCode = 1;
    }
})();
