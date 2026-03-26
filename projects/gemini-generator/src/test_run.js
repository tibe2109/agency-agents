const { generateImage } = require('./generator');
const path = require('path');
const fs = require('fs');

(async () => {
    const outputDir = path.resolve(__dirname, '../output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Use a simple prompt for testing
    const prompt = "A futuristic city with flying cars, neon lights, night time, 8k resolution";
    
    console.log(`🧪 Starting test run with prompt: "${prompt}"`);
    try {
        const imagePath = await generateImage(prompt, outputDir);
        console.log(`🎉 Test success! Image saved at: ${imagePath}`);
    } catch (error) {
        console.error("💥 Test failed:", error);
    }
})();
