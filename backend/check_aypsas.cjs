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
    console.log('✅ SSH Conectado.');
    conn.exec(`ls -la /var/www/clients | grep -i ayp`, (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => {
            console.log(data.toString());
        }).on('close', () => {
            conn.end();
            process.exit(0);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
});

conn.connect(sshConfig);
