const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 restart mekatikos && sleep 2 && pm2 list --no-color | grep mekatikos', (err, stream) => {
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
