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
        console.log('Fetching remote index.js...');
        const indexCode = await execRemoteSSH('24.144.114.69', 'cat /var/www/clients/admin/index.js');
        
        if (indexCode.includes('/api/crm')) {
            console.log('CRM route is already present in index.js on the remote server!');
            return;
        }
        
        console.log('Adding CRM route to index.js...');
        // Insert it right after app.use('/api/pisos', ...)
        const searchStr = "app.use('/api/pisos', require('./routes/pisos.route'));";
        const replaceStr = "app.use('/api/pisos', require('./routes/pisos.route'));\napp.use('/api/crm', require('./routes/crm.route'));";
        
        if (!indexCode.includes(searchStr)) {
            throw new Error('Could not find the hook in index.js to insert crm route.');
        }
        
        const updatedIndexCode = indexCode.replace(searchStr, replaceStr);
        
        // Write it back to a temp file on remote, then move to replace index.js
        console.log('Uploading updated index.js...');
        // To write it cleanly without shell escape issues, we can write a base64 string
        const b64 = Buffer.from(updatedIndexCode).toString('base64');
        const uploadCmd = `echo "${b64}" | base64 -d > /var/www/clients/admin/index.js.tmp && mv /var/www/clients/admin/index.js.tmp /var/www/clients/admin/index.js`;
        
        const uploadResult = await execRemoteSSH('24.144.114.69', uploadCmd);
        console.log('Upload result:', uploadResult);
        
        console.log('Restarting admin pm2 process...');
        const pm2Result = await execRemoteSSH('24.144.114.69', 'pm2 restart admin');
        console.log('PM2 restart output:', pm2Result);
        
    } catch(e) {
        console.error('ERROR:', e);
    }
}

main();
