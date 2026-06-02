const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '24.144.114.69',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\elkin\\.ssh\\do_key_2'),
    readyTimeout: 15000
};

const conn = new Client();
conn.on('ready', () => {
    // pm2 logs mekatikos --lines 100
    conn.exec('pm2 logs mekatikos --lines 50 --nostream', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.error(data.toString());
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect(sshConfig);
