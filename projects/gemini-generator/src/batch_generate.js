const fs = require('fs');
const path = require('path');
const { generateImage } = require('./generator');
const { closeBrowser } = require('./browser');

// Configuration
const DESIGN_DIR = path.resolve(__dirname, '../../fpt-telecom-sash/designs/v3/individual');
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
        const promptMatch = content.match(/## 🎨 Visual Prompt[\s\S]*?```text([\s\S]*?)```/i);
        
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
    console.log('🚀 Starting Batch Generation for V3 Designs...');
    const designs = getDesigns();
    
    console.log(`📋 Found ${designs.length} designs to process.`);

    for (const design of designs) {
        const outputFile = path.join(OUTPUT_DIR, `${design.id}.png`);
        
        // Skip if already exists
        if (fs.existsSync(outputFile)) {
            console.log(`⏩ Skipping ${design.id} (Image exists)`);
            continue;
        }

        console.log(`\n🎨 Generating for: ${design.id}`);
        console.log(`📝 Prompt length: ${design.prompt.length} chars`);
        
        try {
            const finalPath = await generateImage(design.prompt, OUTPUT_DIR);
            
            // Rename the downloaded file to the design ID
            // generateImage returns the path to the downloaded file (likely generic name)
            // We need to rename it to design.id.png
            
            // Wait a bit for file handle release
            await new Promise(r => setTimeout(r, 1000));
            
            if (finalPath !== outputFile) {
                fs.renameSync(finalPath, outputFile);
                console.log(`✅ Renamed to: ${outputFile}`);
            }
            
            // Cool down
            console.log('⏳ Cooling down 10s...');
            await new Promise(r => setTimeout(r, 10000));
            
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
