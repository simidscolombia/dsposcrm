const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '24.144.114.69',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\elkin\\.ssh\\do_key_2'),
    readyTimeout: 10000
};

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 list --no-color | grep mekatikos; echo "---"; cat /var/www/clients/mekatikos/.env 2>/dev/null; echo "---NGINX---"; ls /etc/nginx/sites-enabled/ | grep mekatikos; echo "==="; curl -sI http://127.0.0.1:4000 2>&1 | head -5', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            console.log('ENV: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect(sshConfig);
