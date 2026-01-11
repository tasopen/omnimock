const fs = require('fs');
const path = require('path');

const setsDir = path.join(__dirname, '../public/data/sets');
const outputFile = path.join(__dirname, '../public/data/sets-index.json');

function generateIndex() {
    console.log('Scanning for quiz sets...');
    const flies = fs.readdirSync(setsDir);
    const index = [];

    flies.forEach(file => {
        if (file.endsWith('.json')) {
            const filePath = path.join(setsDir, file);
            try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (content.metadata) {
                    index.push({
                        id: file.replace('.json', ''),
                        file: file,
                        ...content.metadata
                    });
                    console.log(`- Found ${file}: ${content.metadata.title}`);
                }
            } catch (e) {
                console.error(`- Error parsing ${file}:`, e.message);
            }
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
    console.log(`\nSuccessfully generated index with ${index.length} sets.`);
}

generateIndex();
