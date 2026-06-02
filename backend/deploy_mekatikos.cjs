const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const sshConfig = {
    host: '24.144.114.69',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\elkin\\.ssh\\do_key_2'),
    readyTimeout: 15000
};

const FOLDER_NAME = 'mekatikos';
const MONGO_URI = 'mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/?retryWrites=true&w=majority';
const LOCAL_DB_DIR = 'C:\\Users\\elkin\\OneDrive\\Escritorio\\mekatikos';

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
    console.log('🌱 Subiendo base de datos desde archivos locales...');
    const dest = new MongoClient(MONGO_URI);
    try {
        await dest.connect();
        const destDb = dest.db('simids_' + FOLDER_NAME);

        const files = fs.readdirSync(LOCAL_DB_DIR).filter(f => f.endsWith('.json'));
        console.log(`Encontrados ${files.length} archivos JSON.`);

        for (const file of files) {
            // e.g. "dspos.users.json" -> "users"
            const colNameMatch = file.match(/dspos\.(.+)\.json/);
            if (!colNameMatch) continue;
            const colName = colNameMatch[1];

            const filePath = path.join(LOCAL_DB_DIR, file);
            console.log(`⏳ Leyendo ${file}...`);
            const rawData = fs.readFileSync(filePath, 'utf8');
            let docs = [];
            try {
                // Could be an array or a single object. Sometimes it's newline separated JSON objects.
                if (rawData.trim().startsWith('[')) {
                    docs = JSON.parse(rawData);
                } else {
                    // Try parsing as array of objects or ndjson
                    docs = rawData.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
                }
            } catch (e) {
                console.error(`❌ Error parseando ${file}:`, e.message);
                continue;
            }

            if (docs.length > 0) {
                const { ObjectId } = require('mongodb');
                docs = docs.map(doc => {
                    if (doc._id && typeof doc._id === 'object' && doc._id.$oid) {
                        try {
                            doc._id = new ObjectId(doc._id.$oid);
                        } catch(e) {}
                    }
                    for (const key in doc) {
                        if (doc[key] && typeof doc[key] === 'object' && doc[key].$date) {
                            doc[key] = new Date(doc[key].$date);
                        } else if (doc[key] && typeof doc[key] === 'object' && doc[key].$oid) {
                            try {
                                doc[key] = new ObjectId(doc[key].$oid);
                            } catch(e) {}
                        }
                    }
                    return doc;
                });

                await destDb.collection(colName).deleteMany({});
                
                // Chunk insert to avoid Payload Too Large
                const chunkSize = 5000;
                for (let i = 0; i < docs.length; i += chunkSize) {
                    const chunk = docs.slice(i, i + chunkSize);
                    await destDb.collection(colName).insertMany(chunk);
                }
                console.log(`  ✅ ${colName}: ${docs.length} docs subidos.`);
            } else {
                console.log(`  ⚪ ${colName}: 0 docs (ignorado).`);
            }
        }
        console.log('✅ Base de datos restaurada completamente: simids_' + FOLDER_NAME);
    } finally {
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

    const clientPath = `/var/www/clients/${FOLDER_NAME}`;
    console.log('📁 Preparando archivos...');
    await sshExec(conn, `test -d ${clientPath} || cp -R /var/www/seed_template ${clientPath}`);
    await sshExec(conn, `find ${clientPath}/public -type f -name '*.js' -exec sed -i 's|https://nuestrobogota.simids.app|https://${FOLDER_NAME}.poslatino.com|g' {} + 2>/dev/null || true`);

    const DB_CNN = `${MONGO_URI.replace('/?', '/simids_' + FOLDER_NAME + '?')}`;
    const envContent = `PORT=${port}\nDB_CNN=${DB_CNN}\nSECRET_SEED_JWT=mekatikos_jwt_seed_2026_xyz\nAPP_MODE=CLOUD\n`;
    console.log('📝 Escribiendo .env...');
    await sshExec(conn, `cat > ${clientPath}/.env << 'ENVEOF'\n${envContent}\nENVEOF`);

    await sshExec(conn, `pm2 delete ${FOLDER_NAME} 2>/dev/null || true`);
    console.log(`🚀 Iniciando PM2...`);
    await sshExec(conn, `cd ${clientPath} && pm2 start index.js --name "${FOLDER_NAME}" --max-memory-restart 150M --node-args="--max-old-space-size=80"`);

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
    await sshExec(conn, 'pm2 save');

    conn.end();
    console.log('✅ Despliegue completado.');
}

(async () => {
    try {
        await seedDatabase();
        await deploy();
        console.log('\\n🎉 ¡mekatikos creado y desplegado exitosamente!');
        console.log('🔗 URL: https://mekatikos.poslatino.com');
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
