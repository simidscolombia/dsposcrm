const { Client } = require('ssh2');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const sshConfig = {
    host: '24.144.114.69',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\elkin\\.ssh\\do_key_2'),
    readyTimeout: 15000
};

const FOLDER_NAME = 'clubdeportivoturin2';
const MONGO_URI = 'mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/?retryWrites=true&w=majority';
const SEED_DB = 'simids_semilla';
const MASTER_URI = 'mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/?retryWrites=true&w=majority';

function sshExec(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => out += d);
            stream.stderr.on('data', d => out += d);
            stream.on('close', () => resolve(out.trim()));
        });
    });
}

async function seedDatabase() {
    console.log('🌱 Sembrando base de datos en MongoDB (simids6)...');
    const src = new MongoClient(MASTER_URI);
    const dest = new MongoClient(MONGO_URI);
    try {
        await src.connect();
        await dest.connect();
        const srcDb = src.db(SEED_DB);
        const destDb = dest.db('simids_' + FOLDER_NAME);

        const cols = ['users', 'datos', 'departments', 'taxes', 'typeparqs', 'categorias', 'bancos', 'identitycounters'];
        for (const col of cols) {
            const docs = await srcDb.collection(col).find({}).toArray();
            if (docs.length > 0) {
                await destDb.collection(col).deleteMany({});
                await destDb.collection(col).insertMany(docs);
                console.log(`  ✅ ${col}: ${docs.length} docs`);
            } else {
                console.log(`  ⚪ ${col}: vacía (OK)`);
            }
        }
        console.log('✅ Base de datos sembrada: simids_' + FOLDER_NAME);
    } finally {
        await src.close();
        await dest.close();
    }
}

async function deploy() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => resolve()).on('error', reject).connect(sshConfig);
    });
    console.log('🔌 Conectado al servidor.');

    // Find next free port
    const pmList = await sshExec(conn, 'pm2 jlist 2>/dev/null || echo "[]"');
    let port = 4000;
    try {
        const procs = JSON.parse(pmList);
        for (const p of procs) {
            try {
                const envContent = await sshExec(conn, `cat /var/www/clients/${p.name}/.env 2>/dev/null || echo ""`);
                const m = envContent.match(/PORT=(\d+)/);
                if (m) {
                    const usedPort = parseInt(m[1]);
                    if (usedPort >= port) port = usedPort + 1;
                }
            } catch (e) {}
        }
    } catch (e) {}
    console.log(`📡 Puerto asignado: ${port}`);

    // Copy seed template
    const clientPath = `/var/www/clients/${FOLDER_NAME}`;
    console.log('📁 Copiando template semilla...');
    await sshExec(conn, `test -d ${clientPath} || cp -R /var/www/seed_template ${clientPath}`);

    // Patch API URL in frontend
    await sshExec(conn, `find ${clientPath}/public -type f -name '*.js' -exec sed -i 's|https://nuestrobogota.simids.app|https://${FOLDER_NAME}.poslatino.com|g' {} + 2>/dev/null || true`);

    // Write .env
    const DB_CNN = `${MONGO_URI.replace('/?', '/simids_' + FOLDER_NAME + '?')}`;
    const envContent = `PORT=${port}\nDB_CNN=${MONGO_URI.replace('/?retryWrites', '/simids_' + FOLDER_NAME + '?retryWrites')}\nSECRET_SEED_JWT=as%2dkl&am)sdklm32lk@23#asdaj(sdfd-sfbngjn-+*sad\nAPP_MODE=CLOUD\n`;
    console.log('📝 Escribiendo .env...');
    // Write env via heredoc
    await sshExec(conn, `cat > ${clientPath}/.env << 'ENVEOF'\n${envContent}\nENVEOF`);

    // Stop if running
    await sshExec(conn, `pm2 delete ${FOLDER_NAME} 2>/dev/null || true`);

    // Start PM2
    console.log(`🚀 Iniciando PM2 en puerto ${port}...`);
    const pm2Result = await sshExec(conn, `cd ${clientPath} && pm2 start index.js --name "${FOLDER_NAME}" --max-memory-restart 150M --node-args="--max-old-space-size=80"`);
    console.log('PM2:', pm2Result.split('\n').slice(-3).join('\n'));

    // Nginx config
    console.log('🌐 Configurando Nginx...');
    const nginxConfig = `server { listen 80; server_name ${FOLDER_NAME}.poslatino.com www.${FOLDER_NAME}.poslatino.com; return 301 https://${FOLDER_NAME}.poslatino.com$request_uri; }
server {
    listen 443 ssl;
    server_name ${FOLDER_NAME}.poslatino.com;
    ssl_certificate /etc/letsencrypt/live/poslatino.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/poslatino.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
    await sshExec(conn, `cat > /etc/nginx/sites-available/${FOLDER_NAME} << 'NGINXEOF'\n${nginxConfig}\nNGINXEOF`);
    await sshExec(conn, `ln -sf /etc/nginx/sites-available/${FOLDER_NAME} /etc/nginx/sites-enabled/`);
    await sshExec(conn, 'systemctl reload nginx');

    // Save PM2
    await sshExec(conn, 'pm2 save');

    conn.end();
    console.log('✅ Nginx recargado y PM2 guardado.');

    // Verify
    console.log('🔍 Verificando...');
    const verifyConn = new Client();
    await new Promise((r, rej) => verifyConn.on('ready', () => r()).on('error', rej).connect(sshConfig));
    const status = await sshExec(verifyConn, `pm2 list --no-color | grep ${FOLDER_NAME}`);
    const envCheck = await sshExec(verifyConn, `cat ${clientPath}/.env`);
    verifyConn.end();
    console.log('\n📊 Estado PM2:', status);
    console.log('\n📄 .env:', envCheck);
}

(async () => {
    try {
        await seedDatabase();
        await deploy();
        console.log('\n🎉 ¡clubdeportivoturin2 creado y desplegado exitosamente!');
        console.log('🔗 URL: https://clubdeportivoturin2.poslatino.com');
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
