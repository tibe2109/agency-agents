const { getContext } = require('./browser');

(async () => {
    console.log('🌍 Opening Gemini browser for login setup...');
    const context = await getContext();
    const page = await context.newPage();
    await page.goto('https://gemini.google.com/app');
    
    console.log('👉 Please login to your Google account in the opened browser window.');
    console.log('⏳ The script will keep the browser open for 5 minutes.');
    console.log('❌ Press Refesh/Stop or Ctrl+C to exit if done earlier.');
    
    await page.waitForTimeout(300000); // 5 minutes
})();
