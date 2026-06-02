const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/data/precise_extracted_clients.json');
try {
    const clients = JSON.parse(fs.readFileSync(file, 'utf8'));
    const filtered = clients.filter(c => c.subdomain !== 'aypsas' && c.name !== 'aypsas');
    if (clients.length !== filtered.length) {
        fs.writeFileSync(file, JSON.stringify(filtered, null, 2));
        console.log('✅ aypsas eliminado del JSON local');
    } else {
        console.log('❌ aypsas no encontrado en el JSON local');
    }
} catch (e) {
    console.error('Error leyendo JSON:', e);
}
