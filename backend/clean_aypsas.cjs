const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'src/data/detailed_active_clients.json'),
    path.join(__dirname, 'src/data/precise_extracted_clients.json')
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            const filtered = data.filter(c => c.folderName !== 'aypsas' && c.name !== 'aypsas' && c.subdomain !== 'aypsas');
            if (data.length !== filtered.length) {
                fs.writeFileSync(file, JSON.stringify(filtered, null, 2));
                console.log(`✅ aypsas eliminado de ${path.basename(file)}`);
            } else {
                console.log(`❌ aypsas no estaba en ${path.basename(file)}`);
            }
        } catch(e) {
            console.error(`Error en ${path.basename(file)}:`, e.message);
        }
    }
});
