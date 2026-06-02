const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    // First, check what image/upload folders exist in clubdeportivoturin
    conn.exec('ls -la /var/www/clients/clubdeportivoturin/uploads/ 2>/dev/null; echo "==="; ls -la /var/www/clients/clubdeportivoturin/public/uploads/ 2>/dev/null; echo "===IMG==="; ls -la /var/www/clients/clubdeportivoturin/public/img/ 2>/dev/null; echo "===IMAGES==="; find /var/www/clients/clubdeportivoturin -type d -name "uploads" -o -type d -name "images" -o -type d -name "img" 2>/dev/null', (err, stream) => {
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
