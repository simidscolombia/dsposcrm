import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const detailedPath = path.join(__dirname, '..', 'data', 'detailed_active_clients.json');
const precisePath = path.join(__dirname, '..', 'data', 'precise_extracted_clients.json');

// Global list of SSE connections
let sseClients = [];

class CloudController {
    constructor() {
        this.getDeployStream = this.getDeployStream.bind(this);
        this.getInstances = this.getInstances.bind(this);
        this.getInstalledClients = this.getInstalledClients.bind(this);
        this.deployInstance = this.deployInstance.bind(this);
        this.createAndDeployClient = this.createAndDeployClient.bind(this);
        this.getClusters = this.getClusters.bind(this);
        this.getClusterStatus = this.getClusterStatus.bind(this);
        this.executeAction = this.executeAction.bind(this);
        this.getPatches = this.getPatches.bind(this);
        this.applyPatch = this.applyPatch.bind(this);
    }

    // helpers to read files
    _getClientsData() {
        try {
            if (fs.existsSync(detailedPath)) {
                return JSON.parse(fs.readFileSync(detailedPath, 'utf-8'));
            }
        } catch (e) {
            console.error('Error reading detailed_active_clients.json', e.message);
        }
        return [];
    }

    _getPreciseData() {
        try {
            if (fs.existsSync(precisePath)) {
                return JSON.parse(fs.readFileSync(precisePath, 'utf-8'));
            }
        } catch (e) {
            console.error('Error reading precise_extracted_clients.json', e.message);
        }
        return [];
    }

    _saveClientsData(data) {
        fs.writeFileSync(detailedPath, JSON.stringify(data, null, 2));
    }

    _savePreciseData(data) {
        fs.writeFileSync(precisePath, JSON.stringify(data, null, 2));
    }

    // SSH runner
    sshExec(cmd) {
        const SSH_KEY = process.env.DEPLOY_SSH_KEY || 'C:\\Users\\elkin\\.ssh\\do_key_2';
        const SERVER_IP = process.env.DEPLOY_SERVER_IP || '24.144.114.69';
        
        console.log(`[SSH] Executing command on ${SERVER_IP}:`, cmd);
        return new Promise((resolve, reject) => {
            const proc = spawn('ssh', ['-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', 'root@' + SERVER_IP, cmd], { shell: false });
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (d) => { stdout += d.toString(); });
            proc.stderr.on('data', (d) => { stderr += d.toString(); });
            proc.on('close', (code) => {
                resolve(stdout.trim() || stderr.trim());
            });
            proc.on('error', (err) => {
                reject(err);
            });
            proc.stdin.end();
        });
    }

    toBase64(str) { return Buffer.from(str).toString('base64'); }

    async writeRemoteFile(remotePath, content) {
        const b64 = this.toBase64(content);
        await this.sshExec("echo '" + b64 + "' | base64 -d > " + remotePath);
    }

    async readRemoteFile(remotePath) {
        const b64 = await this.sshExec("base64 -w0 " + remotePath + " 2>/dev/null || base64 " + remotePath + " 2>/dev/null || echo ''");
        if (!b64) return '';
        return Buffer.from(b64.trim(), 'base64').toString('utf-8');
    }

    sendSSE(data) {
        const msg = 'data: ' + JSON.stringify(data) + '\n\n';
        sseClients.forEach((res) => { res.write(msg); });
    }

    // API: Connect to SSE log stream
    getDeployStream(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.write('data: {"type":"system","message":"Conectado al panel de control integrado"}\n\n');
        sseClients.push(res);
        req.on('close', () => {
            sseClients = sseClients.filter((c) => c !== res);
        });
    }

    // API: List clients
    async getInstances(req, res) {
        try {
            const clients = this._getClientsData();
            const precise = this._getPreciseData();
            
            // Map Precise database connections and cluster details
            const mapped = clients.map(client => {
                const p = precise.find(x => x.folderName === client.folderName);
                const dbCnn = (p && p.envVars && p.envVars.DB_CNN) || '';
                
                // Get short cluster host
                let cluster = 'Local';
                const match = dbCnn.match(/@([^/?\s]+)/);
                if (match) {
                    let host = match[1].split(',')[0];
                    const parts = host.split('.');
                    cluster = parts.length > 0 ? parts[0] : host;
                }

                return {
                    ...client,
                    cluster,
                    envVars: p ? p.envVars : undefined
                };
            });

            res.json({
                success: true,
                ok: true,
                count: mapped.length,
                data: mapped,
                clients: mapped
            });
        } catch (error) {
            console.error('Error in getInstances:', error.message);
            res.status(500).json({ success: false, error: 'Error al listar clientes en la nube' });
        }
    }

    // API: Query installed folders on VPS
    async getInstalledClients(req, res) {
        try {
            const output = await this.sshExec("ls -1 /var/www/clients/ 2>/dev/null || echo ''");
            const names = output.split('\n').map((s) => s.trim()).filter(Boolean);
            res.json({ success: true, ok: true, installed: names, clients: names });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // Helper to scan PMC processes and find next port
    async _getNextFreePort() {
        let portNumber = 4000;
        try {
            const existingInfo = await this.sshExec("pm2 jlist 2>/dev/null || echo '[]'");
            const procs = JSON.parse(existingInfo);
            for (let p = 0; p < procs.length; p++) {
                try {
                    const envContent = await this.sshExec('cat /var/www/clients/' + procs[p].name + '/.env 2>/dev/null || echo ""');
                    const portMatch = envContent.match(/PORT=(\d+)/);
                    if (portMatch) {
                        const usedPort = parseInt(portMatch[1]);
                        if (usedPort >= portNumber) portNumber = usedPort + 1;
                    }
                } catch (e) {}
            }
        } catch (e) {}
        return portNumber;
    }

    // Deploy core worker
    async deployClientWorker(client, index, total, portNumber) {
        const folderName = client.folderName;
        const clientPath = '/var/www/clients/' + folderName;
        const dbCnn = client.envVars?.DB_CNN || '';
        const jwtSecret = client.envVars?.SECRET_SEED_JWT || client.envVars?.JWT_SECRET || 'SIMIDS_JWT_SEED_2026';

        this.sendSSE({ type: 'progress', client: folderName, index, total, status: 'deploying', message: 'Copiando template semilla...' });

        try {
            // 1. Copy seed template
            await this.sshExec('test -d ' + clientPath + ' || cp -R /var/www/seed_template ' + clientPath);

            // 1.5 Patch Angular frontend hardcoded API URL
            await this.sshExec("find " + clientPath + "/public -type f -name '*.js' -exec sed -i 's|https://nuestrobogota.simids.app|https://" + folderName + ".poslatino.com|g' {} +");

            // 2. Write env file
            const envContent = 'PORT=' + portNumber + '\nDB_CNN=' + dbCnn + '\nSECRET_SEED_JWT=' + jwtSecret + '\nAPP_MODE=CLOUD\n';
            await this.writeRemoteFile(clientPath + '/.env', envContent);

            this.sendSSE({ type: 'progress', client: folderName, index, total, status: 'deploying', message: 'Iniciando PM2 puerto ' + portNumber + '...' });

            // 3. Stop if running
            await this.sshExec('pm2 delete ' + folderName + ' 2>/dev/null || true');

            // 4. Start PM2
            await this.sshExec('cd ' + clientPath + ' && pm2 start index.js --name "' + folderName + '" --max-memory-restart 150M --node-args="--max-old-space-size=80"');

            this.sendSSE({ type: 'progress', client: folderName, index, total, status: 'deploying', message: 'Configurando Nginx...' });

            // 5. Nginx config
            const nginxContent = 'server { listen 80; server_name ' + folderName + '.poslatino.com www.' + folderName + '.poslatino.com; return 301 https://' + folderName + '.poslatino.com$request_uri; }\n' +
                               'server {\n    listen 443 ssl;\n    server_name ' + folderName + '.poslatino.com;\n' +
                               '    ssl_certificate /etc/letsencrypt/live/poslatino.com/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/poslatino.com/privkey.pem;\n\n' +
                               '    location / {\n        proxy_pass http://127.0.0.1:' + portNumber + ';\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n}\n';
            await this.writeRemoteFile('/etc/nginx/sites-available/' + folderName, nginxContent);
            await this.sshExec('ln -sf /etc/nginx/sites-available/' + folderName + ' /etc/nginx/sites-enabled/');
            await this.sshExec('systemctl reload nginx');

            this.sendSSE({ type: 'progress', client: folderName, index, total, status: 'success', message: '✅ OK (puerto ' + portNumber + ')' });
            return true;
        } catch (err) {
            this.sendSSE({ type: 'progress', client: folderName, index, total, status: 'error', message: '❌ Error: ' + err.message });
            return false;
        }
    }

    // API: Deploy existing clients
    async deployInstance(req, res) {
        try {
            const { clients } = req.body; // array of folderNames
            if (!clients || !Array.isArray(clients) || clients.length === 0) {
                return res.status(400).json({ success: false, error: 'Parámetro clients requerido' });
            }

            res.json({ success: true, ok: true, message: `Iniciando despliegue de ${clients.length} nubes en segundo plano` });

            // Run deploy process in background
            (async () => {
                const clientsData = this._getClientsData();
                const preciseData = this._getPreciseData();
                
                const selected = clientsData.filter((c) => clients.includes(c.folderName)).map(c => {
                    const p = preciseData.find(x => x.folderName === c.folderName);
                    return {
                        ...c,
                        envVars: p ? p.envVars : undefined
                    };
                });

                this.sendSSE({ type: 'system', message: '🚀 Iniciando despliegue de ' + selected.length + ' clientes...' });

                let portNumber = await this._getNextFreePort();
                this.sendSSE({ type: 'system', message: '📡 Puerto inicial seguro asignado: ' + portNumber });

                // Create folder
                await this.sshExec('mkdir -p /var/www/clients');

                let success = 0;
                let errors = 0;

                for (let i = 0; i < selected.length; i++) {
                    const ok = await this.deployClientWorker(selected[i], i + 1, selected.length, portNumber);
                    if (ok) success++;
                    else errors++;
                    portNumber++;
                }

                // Final reload Nginx & PM2 save
                this.sendSSE({ type: 'system', message: '💾 Guardando configuración PM2...' });
                await this.sshExec('pm2 save 2>/dev/null || true');

                this.sendSSE({ type: 'system', message: '🔄 Recargando Nginx...' });
                await this.sshExec('rm -f /etc/nginx/sites-enabled/default');
                const nginxTest = await this.sshExec('nginx -t 2>&1');
                this.sendSSE({ type: 'system', message: 'Nginx: ' + nginxTest });
                await this.sshExec('systemctl reload nginx 2>/dev/null || true');

                this.sendSSE({ type: 'complete', success, errors, total: selected.length, message: '🎉 Completado: ' + success + ' OK, ' + errors + ' errores de ' + selected.length });
            })().catch(err => {
                this.sendSSE({ type: 'system', message: '❌ Error crítico en despliegue: ' + err.message });
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Helper: Seed MongoDB database from simids_semilla (or clone from existing)
    async seedNewClientDatabase(folderName, destDbCnn, cloneFromUri = null) {
        let masterUri = "mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/?retryWrites=true&w=majority";
        let srcDbName = 'simids_semilla';

        if (cloneFromUri) {
            masterUri = cloneFromUri;
            const match = cloneFromUri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)/);
            if (match && match[1]) {
                srcDbName = match[1];
            } else {
                this.sendSSE({ type: 'system', message: '⚠️ No se pudo determinar la BD origen de la URL de clonación, intentando predeterminado.' });
            }
            this.sendSSE({ type: 'system', message: '🌱 Clonando base de datos desde ' + srcDbName + '...' });
        } else {
            this.sendSSE({ type: 'system', message: '🌱 Inicializando base de datos desde simids_semilla...' });
        }

        let destUri = destDbCnn;
        const uriMatch = destUri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)([^/?]*)(\??.*)$/);
        if (uriMatch) {
            destUri = uriMatch[1] + 'simids_' + folderName + (uriMatch[3] || '');
        } else if (destUri.endsWith('/')) {
            destUri = destUri + 'simids_' + folderName;
        }
        
        this.sendSSE({ type: 'system', message: '📡 Conectando clúster destino: simids_' + folderName });
        
        const srcClient = new MongoClient(masterUri);
        const destClient = new MongoClient(destUri);
        try {
            await srcClient.connect();
            await destClient.connect();
            const srcDb = srcClient.db(srcDbName);
            const destDb = destClient.db('simids_' + folderName);
            
            const collectionsToCopy = [
                'users',
                'datos',
                'departments',
                'taxes',
                'typeparqs',
                'categorias',
                'bancos',
                'identitycounters'
            ];

            if (cloneFromUri) {
                // Si estamos clonando, copiamos también productos y otras tablas útiles (excluyendo facturas/ventas)
                collectionsToCopy.push('products', 'mesas');
                this.sendSSE({ type: 'system', message: '📦 Modo Clonación: Se copiarán productos y categorías completas.' });
            }
            
            for (const colName of collectionsToCopy) {
                const srcDocs = await srcDb.collection(colName).find({}).toArray();
                if (srcDocs.length > 0) {
                    await destDb.collection(colName).deleteMany({});
                    
                    let docsToInsert = [...srcDocs];
                    if (colName === 'datos') {
                        docsToInsert = srcDocs.map(doc => ({
                            ...doc,
                            name: "EMPRESA " + folderName.toUpperCase(),
                            header: "EMPRESA " + folderName.toUpperCase() + " \nNo responsable de IVA",
                            footer: "GRACIAS POR SU VISITA"
                        }));
                    }
                    
                    await destDb.collection(colName).insertMany(docsToInsert);
                    this.sendSSE({ type: 'system', message: '  📋 ' + colName + ': ' + docsToInsert.length + ' docs copiados' });
                }
            }
            this.sendSSE({ type: 'system', message: '✅ Base de datos inicializada correctamente.' });
            return true;
        } catch (err) {
            this.sendSSE({ type: 'system', message: '⚠️ Error de inicialización: ' + err.message });
            return false;
        } finally {
            await srcClient.close();
            await destClient.close();
        }
    }

    // API: Create and Deploy new client
    async createAndDeployClient(req, res) {
        try {
            const { folderName, subdomain, dbCnn, jwtSecret, cloneFrom, forcePort } = req.body;
            const targetFolderName = folderName || subdomain;
            
            if (!targetFolderName) {
                return res.status(400).json({ success: false, error: 'Parámetro folderName o subdomain requerido' });
            }

            const cleanFolderName = targetFolderName.trim().toLowerCase();
            if (!cleanFolderName.match(/^[a-z0-9-]+$/)) {
                return res.status(400).json({ success: false, error: 'Nombre de cliente inválido (solo minúsculas, números y guiones)' });
            }

            const clientsData = this._getClientsData();
            if (clientsData.some(c => c.folderName === cleanFolderName)) {
                return res.status(400).json({ success: false, error: 'El cliente ya existe en el sistema' });
            }

            let cleanDbCnn = dbCnn?.trim();
            if (!cleanDbCnn) {
                const selectedCluster = req.body.cluster || 'restaurantes';
                const preciseData = this._getPreciseData();
                const sample = preciseData.find(p => {
                    const cnn = p.mongoUri || p.envVars?.DB_CNN || '';
                    return cnn.includes(selectedCluster);
                });
                if (sample) {
                    const sampleCnn = sample.mongoUri || sample.envVars?.DB_CNN;
                    const match = sampleCnn.match(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)([^/?]*)(\??.*)$/);
                    if (match) {
                        cleanDbCnn = match[1] + 'simids_' + cleanFolderName + (match[3] || '');
                    } else {
                        cleanDbCnn = sampleCnn.replace(/\/([^/?]+)(\?|$)/, '/simids_' + cleanFolderName + '$2');
                    }
                } else {
                    cleanDbCnn = "mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/simids_" + cleanFolderName + "?retryWrites=true&w=majority";
                }
            }

            const cleanJwtSecret = jwtSecret?.trim() || ('v2_' + cleanFolderName);
            let cloneFromUri = null;

            if (cloneFrom) {
                const preciseData = this._getPreciseData();
                const sourceClient = preciseData.find(c => c.folderName === cloneFrom);
                if (sourceClient && (sourceClient.mongoUri || (sourceClient.envVars && sourceClient.envVars.DB_CNN))) {
                    cloneFromUri = sourceClient.mongoUri || sourceClient.envVars.DB_CNN;
                } else {
                    return res.status(400).json({ success: false, error: 'No se encontró la conexión de la BD del cliente a clonar (' + cloneFrom + ')' });
                }
            }

            res.json({ success: true, ok: true, message: 'Iniciando ' + (cloneFrom ? 'clonación' : 'creación') + ' y despliegue del cliente ' + cleanFolderName });

            // Run creation process in background
            (async () => {
                if (cloneFrom) {
                    this.sendSSE({ type: 'system', message: `➕ Clonando cliente ${cloneFrom} -> ${cleanFolderName}...` });
                } else {
                    this.sendSSE({ type: 'system', message: '➕ Creando nuevo cliente: ' + cleanFolderName + '...' });
                }
                
                const portNumber = forcePort ? parseInt(forcePort) : await this._getNextFreePort();
                this.sendSSE({ type: 'system', message: '📡 Puerto seguro asignado automáticamente: ' + portNumber });
                
                const newClientDetail = {
                    folderName: cleanFolderName,
                    dbName: 'simids_' + cleanFolderName,
                    invoiceCount: 0,
                    lastInvoiceYear: 2026,
                    lastInvoiceDate: new Date().toISOString(),
                    lastInvoiceAmount: 0,
                    lastInvoiceNumber: 0,
                    domain: cleanFolderName + '.poslatino.com',
                };

                // Add to detailed active catalog
                clientsData.push(newClientDetail);
                this._saveClientsData(clientsData);

                // Add to precise extracted catalog
                const preciseData = this._getPreciseData();
                preciseData.push({
                    serverName: "Nube DigitalOcean (24.144.114.69)",
                    serverIp: "24.144.114.69",
                    folderName: cleanFolderName,
                    pm2Name: cleanFolderName,
                    port: portNumber,
                    dbName: "simids_" + cleanFolderName,
                    mongoUri: cleanDbCnn,
                    domain: cleanFolderName + ".poslatino.com",
                    filePath: "/var/www/clients/" + cleanFolderName + "/.env",
                    envVars: {
                        PORT: String(portNumber),
                        DB_CNN: cleanDbCnn,
                        SECRET_SEED_JWT: cleanJwtSecret
                    }
                });
                this._savePreciseData(preciseData);

                this.sendSSE({ type: 'system', message: '💾 Registrado en catálogos del CRM.' });

                // Seed database
                await this.seedNewClientDatabase(cleanFolderName, cleanDbCnn, cloneFromUri);

                // Deploy
                newClientDetail.envVars = { PORT: String(portNumber), DB_CNN: cleanDbCnn, SECRET_SEED_JWT: cleanJwtSecret };
                const ok = await this.deployClientWorker(newClientDetail, 1, 1, portNumber);

                if (ok) {
                    this.sendSSE({ type: 'system', message: '💾 Guardando PM2...' });
                    await this.sshExec('pm2 save 2>/dev/null || true');

                    this.sendSSE({ type: 'system', message: '🔄 Recargando Nginx...' });
                    await this.sshExec('rm -f /etc/nginx/sites-enabled/default');
                    const nginxTest = await this.sshExec('nginx -t 2>&1');
                    this.sendSSE({ type: 'system', message: 'Nginx: ' + nginxTest });
                    await this.sshExec('systemctl reload nginx 2>/dev/null || true');

                    this.sendSSE({ type: 'complete', success: 1, errors: 0, total: 1, message: '🎉 Cliente ' + cleanFolderName + ' creado, sembrado y desplegado con éxito!' });
                } else {
                    this.sendSSE({ type: 'complete', success: 0, errors: 1, total: 1, message: '❌ Falló la instalación del cliente ' + cleanFolderName });
                }

            })().catch(err => {
                this.sendSSE({ type: 'system', message: '❌ Error crítico al crear cliente: ' + err.message });
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // API: Cluster catalog
    async getClusters(req, res) {
        try {
            const preciseData = this._getPreciseData();
            const clusters = {};

            preciseData.forEach(p => {
                const dbCnn = p.mongoUri || (p.envVars && p.envVars.DB_CNN) || '';
                if (!dbCnn || dbCnn === 'N/A') return;

                let shortName = 'Local';
                let hostName = 'Local';
                const match = dbCnn.match(/@([^/?\s]+)/);
                if (match) {
                    hostName = match[1];
                    let host = hostName.split(',')[0];
                    const parts = host.split('.');
                    shortName = parts.length > 0 ? parts[0] : host;
                }

                if (!clusters[shortName]) {
                    clusters[shortName] = {
                        name: shortName,
                        fullHost: hostName,
                        clientCount: 0,
                        clients: [],
                        sampleCnn: dbCnn
                    };
                }
                clusters[shortName].clientCount++;
                clusters[shortName].clients.push(p.folderName);
            });

            res.json({ success: true, ok: true, count: Object.keys(clusters).length, data: Object.values(clusters), clusters: Object.values(clusters) });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // API: Cluster storage capacity and status check
    async getClusterStatus(req, res) {
        try {
            const { host } = req.query;
            if (!host) {
                return res.status(400).json({ success: false, error: 'Parámetro host requerido' });
            }

            const preciseData = this._getPreciseData();
            const sampleClient = preciseData.find(p => {
                const dbCnn = p.mongoUri || (p.envVars && p.envVars.DB_CNN) || '';
                return dbCnn.includes(host);
            });

            if (!sampleClient) {
                return res.status(400).json({ success: false, error: 'No se encontró cadena de conexión para el clúster: ' + host });
            }

            const dbCnn = sampleClient.mongoUri || sampleClient.envVars.DB_CNN;
            const client = new MongoClient(dbCnn, { connectTimeoutMS: 5000, socketTimeoutMS: 5000 });
            
            try {
                await client.connect();
                const adminDb = client.db().admin();
                const list = await adminDb.listDatabases();
                
                const databases = list.databases.map(db => ({
                    name: db.name,
                    sizeBytes: db.sizeOnDisk,
                    sizeMB: (db.sizeOnDisk / (1024 * 1024)).toFixed(2)
                })).sort((a, b) => b.sizeBytes - a.sizeBytes);
                
                const totalSizeBytes = list.databases.reduce((sum, db) => sum + db.sizeOnDisk, 0);
                const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
                
                res.json({
                    success: true,
                    databases: databases,
                    totalSizeBytes: totalSizeBytes,
                    totalSizeMB: totalSizeMB
                });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            } finally {
                await client.close();
            }
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // API: Actions (PM2 actions or restart)
    async executeAction(req, res) {
        try {
            const { action, subdomain, folderName } = req.body;
            const name = folderName || subdomain;
            if (!name || !action) {
                return res.status(400).json({ success: false, error: 'Parámetros action y folderName/subdomain requeridos' });
            }

            let cmd = '';
            if (action === 'restart') {
                cmd = `pm2 restart ${name}`;
            } else if (action === 'stop') {
                cmd = `pm2 stop ${name}`;
            } else if (action === 'start') {
                cmd = `pm2 start ${name}`;
            } else if (action === 'delete') {
                cmd = `pm2 delete ${name}`;
            } else {
                return res.status(400).json({ success: false, error: 'Acción no soportada' });
            }

            const output = await this.sshExec(cmd);
            res.json({ success: true, ok: true, message: `Acción ${action} ejecutada para ${name}`, detail: output });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // --- PATCH MANAGEMENT LOGIC ---

    // API: List remote patches on VPS
    async getPatches(req, res) {
        try {
            const output = await this.sshExec("find /var/www/patches -maxdepth 2 -name 'metadata.json' 2>/dev/null || echo ''");
            const files = output.split('\n').map((s) => s.trim()).filter(Boolean);
            const patches = [];
            
            for (let i = 0; i < files.length; i++) {
                try {
                    const content = await this.readRemoteFile(files[i]);
                    if (content) {
                        patches.push(JSON.parse(content));
                    }
                } catch (err) {
                    console.error('Error reading patch metadata:', files[i], err.message);
                }
            }
            
            res.json({ success: true, ok: true, count: patches.length, data: patches, patches: patches });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // API: Apply patch to specific client
    async applyPatch(req, res) {
        try {
            const { clientFolder, patchId } = req.body;
            if (!clientFolder || !patchId) {
                return res.status(400).json({ success: false, error: 'Parámetros clientFolder y patchId requeridos' });
            }

            const clientsData = this._getClientsData();
            if (!clientsData.some(c => c.folderName === clientFolder)) {
                return res.status(400).json({ success: false, error: 'El cliente especificado no existe' });
            }

            res.json({ success: true, ok: true, message: `Iniciando aplicación del parche ${patchId} a ${clientFolder}` });

            // Background worker
            (async () => {
                const metaPath = '/var/www/patches/' + patchId + '/metadata.json';
                const metaContent = await this.readRemoteFile(metaPath);
                if (!metaContent) {
                    throw new Error('No se encontró la configuración del parche: ' + patchId);
                }
                const meta = JSON.parse(metaContent);

                this.sendSSE({ type: 'system', message: '🛠️ Aplicando parche "' + meta.name + '" a ' + clientFolder + '...' });

                for (let a = 0; a < meta.actions.length; a++) {
                    const action = meta.actions[a];
                    this.sendSSE({ type: 'system', message: '👉 Acción ' + (a+1) + '/' + meta.actions.length + ': ' + action.type });

                    if (action.type === 'copy_file') {
                        const src = '/var/www/patches/' + patchId + '/' + action.source;
                        const dest = action.destination.replace(/{folderName}/g, clientFolder);
                        const destDir = dest.substring(0, dest.lastIndexOf('/'));
                        
                        await this.sshExec('mkdir -p ' + destDir);
                        await this.sshExec('cp ' + src + ' ' + dest);
                        this.sendSSE({ type: 'system', message: '   Copiado: ' + src + ' -> ' + dest });
                    }
                    else if (action.type === 'nginx_patch') {
                        const nginxFile = action.config_file.replace(/{folderName}/g, clientFolder);
                        let content = await this.readRemoteFile(nginxFile);
                        if (!content) {
                            throw new Error('No se pudo leer la configuración de Nginx: ' + nginxFile);
                        }

                        const lineToAdd = action.add_line_inside_server_443;
                        if (content.includes(lineToAdd)) {
                            this.sendSSE({ type: 'system', message: '   Nginx ya contiene: ' + lineToAdd });
                        } else {
                            const pattern = /(listen\s+443\s+ssl\s*;[\s\S]*?server_name\s+[^;]+;)/;
                            if (pattern.test(content)) {
                                content = content.replace(pattern, '$1\n    ' + lineToAdd);
                                await this.writeRemoteFile(nginxFile, content);
                                this.sendSSE({ type: 'system', message: '   Nginx actualizado con: ' + lineToAdd });
                            } else {
                                throw new Error('No se pudo encontrar el bloque server HTTPS (443 ssl) en la configuración de Nginx');
                            }
                        }
                    }
                    else if (action.type === 'reload_nginx') {
                        const testRes = await this.sshExec('nginx -t 2>&1');
                        if (testRes.includes('successful')) {
                            await this.sshExec('systemctl reload nginx');
                            this.sendSSE({ type: 'system', message: '   Nginx recargado con éxito' });
                        } else {
                            throw new Error('Sintaxis de Nginx inválida: ' + testRes);
                        }
                    }
                    else if (action.type === 'restart_pm2') {
                        const procName = action.process_name.replace(/{folderName}/g, clientFolder);
                        await this.sshExec('pm2 restart ' + procName);
                        this.sendSSE({ type: 'system', message: '   Proceso PM2 "' + procName + '" reiniciado' });
                    }
                }

                this.sendSSE({ type: 'system', message: '✅ Parche "' + meta.name + '" aplicado con éxito en ' + clientFolder + '!' });
                this.sendSSE({ type: 'complete', success: 1, errors: 0, total: 1, message: `🎉 Parche aplicado exitosamente a ${clientFolder}` });
            })().catch(err => {
                this.sendSSE({ type: 'system', message: '❌ Error aplicando parche: ' + err.message });
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new CloudController();
