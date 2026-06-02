require('dotenv').config();
const { Client } = require('ssh2');

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
        if (process.env.SSH_PASSWORD) {
            sshConfig.password = process.env.SSH_PASSWORD;
        }
        conn.connect(sshConfig);
    });
}

async function main() {
    try {
        console.log('Checking Server 01 (24.144.114.69)...');
        const ls = await execRemoteSSH('24.144.114.69', 'ls -la /var/www/clients/ | grep admin || echo "No admin directory"');
        console.log('LS:', ls);

        const pm2 = await execRemoteSSH('24.144.114.69', 'pm2 jlist 2>/dev/null | grep -o "\\"name\\":\\"[^\\"]*\\"" | grep admin || echo "No admin process"');
        console.log('PM2:', pm2);
        
        const nginx = await execRemoteSSH('24.144.114.69', 'ls /etc/nginx/sites-enabled/ | grep admin || echo "No admin nginx config"');
        console.log('NGINX:', nginx);
    } catch(e) {
        console.error('ERROR:', e);
    }
}

main();
