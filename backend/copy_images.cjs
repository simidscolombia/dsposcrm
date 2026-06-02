const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('🔌 Conectado. Copiando imágenes...');
    conn.exec('cp -R /var/www/clients/clubdeportivoturin/uploads/* /var/www/clients/clubdeportivoturin2/uploads/ 2>/dev/null && echo "✅ Imágenes copiadas" || echo "❌ Error al copiar"; echo "---VERIFICANDO---"; ls -la /var/www/clients/clubdeportivoturin2/uploads/; echo "---PRODUCTS---"; ls /var/www/clients/clubdeportivoturin2/uploads/products/ | wc -l', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
        stream.on('data', d => console.log(d.toString()));
        stream.stderr.on('data', d => console.error(d.toString()));
    });
}).on('error', err => console.error('SSH Error:', err))
.connect({
    host: '24.144.114.69',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\elkin\\.ssh\\do_key_2'),
    readyTimeout: 10000
});
