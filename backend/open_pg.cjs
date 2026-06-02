const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '24.144.114.69',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\elkin\\.ssh\\do_key_2'),
    readyTimeout: 10000
};

const commands = [
    `sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/*/main/postgresql.conf`,
    `echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf`,
    `systemctl restart postgresql`
];

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ SSH Conectado. Modificando Postgres...');
    conn.exec(commands.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('data', (data) => console.log(data.toString()))
              .on('stderr', (data) => console.error(data.toString()))
              .on('close', () => {
                  console.log('Postgres configurado.');
                  conn.end();
                  process.exit(0);
              });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
});

conn.connect(sshConfig);
