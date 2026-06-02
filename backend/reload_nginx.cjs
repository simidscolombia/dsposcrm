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
    console.log('Connected to remote server.');
    conn.exec('systemctl reload nginx', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Nginx reloaded with code ' + code);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect(sshConfig);
