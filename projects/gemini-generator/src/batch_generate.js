const fs = require('fs');
const path = require('path');
const { generateImage } = require('./generator');
const { closeBrowser } = require('./browser');

// Configuration
const DESIGN_DIR = path.resolve(__dirname, '../../fpt-telecom-sash/designs/v4/individual');
const OUTPUT_DIR = path.resolve(__dirname, '../../fb-engagement-tool/images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function getDesigns() {
    if (!fs.existsSync(DESIGN_DIR)) {
        console.error(`❌ Design directory not found: ${DESIGN_DIR}`);
        return [];
    }
    const files = fs.readdirSync(DESIGN_DIR).filter(f => f.endsWith('.md'));
    const designs = [];

    for (const file of files) {
        const content = fs.readFileSync(path.join(DESIGN_DIR, file), 'utf8');
        const id = path.parse(file).name;
        
        // Extract Visual Prompt
        // Logic: Find "## 🎨 Visual Prompt" and get the text inside code block
        const promptMatch = content.match(
            /##\s*(?:🎨\s*Visual Prompt|🖼️\s*IMAGE GENERATION PROMPT)[\s\S]*?```(?:text)?\s*([\s\S]*?)```/i
        );
        if (promptMatch && promptMatch[1]) {
            let prompt = promptMatch[1].trim();
            // Remove [] brackets if needed or keep them as Gemini understands them well
            // clean up newlines to single line for cleaner input? 
            // Gemini handles multiline fine.
            designs.push({ id, prompt });
        } else {
            console.warn(`⚠️ No visual prompt found for ${id}`);
        }
    }
    return designs;
}

async function runBatch() {
    console.log('🚀 Starting Batch Generation for V4 Designs...');
    const designs = getDesigns();
    
    console.log(`📋 Found ${designs.length} designs to process.`);

    for (const design of designs) {
        console.log(`\n🎨 Generating for: ${design.id}`);
        console.log(`📝 Prompt length: ${design.prompt.length} chars`);
        
        try {
            await generateImage(design.prompt, OUTPUT_DIR);
            // generateImage now does: open tab -> click image mode -> paste prompt -> send -> wait 10s.
            console.log('✅ Prompt submitted successfully.');
            
        } catch (error) {
            console.error(`❌ Failed to generate ${design.id}:`, error.message);
            // Optionally continue or break
            // We continue to try next one
        }
    }
    
    console.log('\n🎉 Batch processing completed!');
    await closeBrowser();
}

runBatch().catch(console.error);
