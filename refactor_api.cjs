const fs = require('fs');
const path = require('path');

const srcDirs = [
    path.join(__dirname, 'frontend', 'src', 'pages'),
    path.join(__dirname, 'frontend', 'src', 'components')
];

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            if (filepath.endsWith('.jsx') || filepath.endsWith('.js')) {
                filelist.push(filepath);
            }
        }
    });
    return filelist;
}

let allFiles = [];
srcDirs.forEach(dir => {
    allFiles = allFiles.concat(walkSync(dir));
});

let modifiedCount = 0;

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace const API_URL = ...
    content = content.replace(/const\s+API_URL\s*=\s*.*?['"`].*?['"`].*?;/g, "const API_URL = '';");
    
    // Replace const API_BASE = ...
    content = content.replace(/const\s+API_BASE\s*=\s*.*?['"`].*?['"`].*?;/g, "const API_BASE = '';");

    // Replace const API = '/api/infrastructure';
    content = content.replace(/const\s+API\s*=\s*['"`]\/api\/infrastructure['"`];/g, "const API = '/infrastructure';");
    content = content.replace(/const\s+API\s*=\s*['"`]\/api\/infrastructure['"`]/g, "const API = '/infrastructure'");
    
    // Specifically handle the ConversationalStep.jsx and QuotePreview.jsx complex assignment
    content = content.replace(/const\s+API_URL\s*=\s*RAW_API_URL.*?;/g, "const API_URL = '';");

    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Modified:', file);
        modifiedCount++;
    }
});

console.log(`\nRefactoring complete. Modified ${modifiedCount} files.`);
