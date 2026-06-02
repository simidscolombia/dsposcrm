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
    conn.exec('sudo -u postgres psql -c "\\l" || psql -U postgres -h 127.0.0.1 -c "\\l"', (err, stream) => {
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
