require('dotenv').config();
const { Client } = require('ssh2');
const fs = require('fs');

function execRemoteSSH(host, cmd) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const timeout = setTimeout(() => { conn.end(); reject(new Error('timeout')); }, 25000);
        conn.on('ready', () => {
            conn.exec(cmd, (err, stream) => {
                if (err) { clearTimeout(timeout); return reject(err); }
                let out = '';
                stream.on('data', d => out += d);
                stream.stderr.on('data', d => out += d);
                stream.on('close', () => { clearTimeout(timeout); conn.end(); resolve(out.trim()); });
            });
        }).on('error', e => { clearTimeout(timeout); reject(e); })
        
        const sshConfig = { host, port: 22, username: 'root' };
        
        const keyPath = process.env.DEPLOY_SSH_KEY;
        if (keyPath && fs.existsSync(keyPath)) {
            sshConfig.privateKey = fs.readFileSync(keyPath);
        } else if (process.env.SSH_PASSWORD) {
            sshConfig.password = process.env.SSH_PASSWORD;
        }
        
        conn.connect(sshConfig);
    });
}

async function main() {
    try {
        console.log('Listing /var/www/clients/admin...');
        const listDir = await execRemoteSSH('24.144.114.69', 'ls -la /var/www/clients/admin');
        console.log('\n--- Directory list ---\n', listDir);
        
        console.log('Fetching remote .env...');
        const envContent = await execRemoteSSH('24.144.114.69', 'cat /var/www/clients/admin/.env');
        console.log('\n--- Remote .env ---\n', envContent);
    } catch(e) {
        console.error('ERROR:', e);
    }
}

main();
