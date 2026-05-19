import db from '../config/database.js';
import { Client } from 'ssh2';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

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
        .connect({ host, port: 22, username: 'root', password: process.env.SSH_PASSWORD });
    });
}

class InfrastructureController {
    async getOverview(req, res) {
        try {
            const data = await db.query('SELECT * FROM infrastructure_data ORDER BY updated_at DESC LIMIT 1');
            if (data.rows.length === 0) return res.json({ success: true, data: { servers: [], clusters: [], clients: [], orphans: [] } });
            res.json({ success: true, data: JSON.parse(data.rows[0].payload) });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async getServers(req, res) {
        try {
            const data = await db.query('SELECT * FROM infrastructure_servers ORDER BY name');
            res.json({ success: true, data: data.rows });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async getClusters(req, res) {
        try {
            const data = await db.query('SELECT * FROM infrastructure_clusters ORDER BY name');
            res.json({ success: true, data: data.rows });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async getPosClients(req, res) {
        try {
            const techData = await db.query('SELECT * FROM infrastructure_pos_clients ORDER BY name');
            try {
                const commData = await db.query('SELECT id, subdomain, plan_type, phone, whatsapp FROM crm_clients');
                const commMap = {};
                commData.rows.forEach(c => { if (c.subdomain) commMap[c.subdomain] = c; });
                const enriched = techData.rows.map(ipc => {
                    const commercial = commMap[ipc.name] || {};
                    return { 
                        ...ipc, 
                        crm_client_id: commercial.id || null,
                        plan_type: commercial.plan_type || 'cloud', 
                        contact_phone: commercial.phone || commercial.whatsapp || ipc.owner_phone || 'N/A' 
                    };
                });
                return res.json({ success: true, data: enriched });
            } catch (commError) { return res.json({ success: true, data: techData.rows }); }
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async getOrphans(req, res) {
        try {
            const q = "SELECT * FROM infrastructure_pos_clients WHERE status = 'orphan' OR status = 'empty_db' OR db_size_mb < 0.2 ORDER BY name";
            const data = await db.query(q);
            res.json({ success: true, data: data.rows });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async getStats(req, res) {
        try {
            const tc = await db.query('SELECT count(*) FROM infrastructure_pos_clients');
            const ts = await db.query('SELECT count(*) FROM infrastructure_servers');
            const tcl = await db.query('SELECT count(*) FROM infrastructure_clusters');
            const th = await db.query("SELECT count(*) FROM infrastructure_pos_clients WHERE status = 'active'");
            const to = await db.query("SELECT count(*) FROM infrastructure_pos_clients WHERE status IN ('orphan', 'empty_db')");
            const dbSize = await db.query("SELECT SUM(db_size_mb) as total FROM infrastructure_pos_clients");
            
            res.json({ 
                success: true, 
                data: { 
                    totalClients: parseInt(tc.rows[0].count), 
                    totalServers: parseInt(ts.rows[0].count), 
                    totalClusters: parseInt(tcl.rows[0].count),
                    healthyClients: parseInt(th.rows[0].count),
                    orphanClients: parseInt(to.rows[0].count),
                    totalDbSizeMB: parseFloat(dbSize.rows[0].total || 0)
                } 
            });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async updatePosClient(req, res) {
        try {
            const { id } = req.params;
            const { owner_name, owner_phone, owner_email, notes, status } = req.body;
            const result = await db.query(
                'UPDATE infrastructure_pos_clients SET owner_name = COALESCE($1, owner_name), owner_phone = COALESCE($2, owner_phone), owner_email = COALESCE($3, owner_email), notes = COALESCE($4, notes), status = COALESCE($5, status), updated_at = NOW() WHERE id = $6 RETURNING *',
                [owner_name, owner_phone, owner_email, notes, status, id]
            );
            res.json({ success: true, data: result.rows[0] });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async getPm2Status(req, res) {
        try {
            const { server_id } = req.params;
            const srv = await db.query('SELECT ip FROM infrastructure_servers WHERE id = $1', [server_id]);
            if (srv.rows.length === 0) return res.status(404).json({ success: false, error: 'Server not found' });
            const ip = srv.rows[0].ip;
            const cmd = 'pm2 jlist 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps([{\\"name\\":p[\\"name\\"],\\"status\\":p[\\"pm2_env\\"][\\"status\\"],\\"memory\\":p[\\"monit\\"][\\"memory\\"],\\"cpu\\":p[\\"monit\\"][\\"cpu\\"]} for p in sorted(d, key=lambda x: x[\\"name\\"])]))"';
            const output = await execRemoteSSH(ip, cmd);
            try {
                const processes = JSON.parse(output);
                res.json({ success: true, data: processes });
            } catch (e) { res.json({ success: true, data: [], raw: output }); }
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async pm2Action(req, res) {
        try {
            const { server_id, action } = req.params;
            const { processName } = req.body;
            if (!['start', 'stop', 'restart'].includes(action)) {
                return res.status(400).json({ success: false, error: 'Invalid action' });
            }
            const srv = await db.query('SELECT ip FROM infrastructure_servers WHERE id = $1', [server_id]);
            if (srv.rows.length === 0) return res.status(404).json({ success: false, error: 'Server not found' });
            await execRemoteSSH(srv.rows[0].ip, "pm2 " + action + " " + processName);
            res.json({ success: true, message: 'Action executed' });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async pm2Logs(req, res) {
        try {
            const { server_id, process_name } = req.params;
            const srv = await db.query('SELECT ip FROM infrastructure_servers WHERE id = $1', [server_id]);
            if (srv.rows.length === 0) return res.status(404).json({ success: false, error: 'Server not found' });
            const output = await execRemoteSSH(srv.rows[0].ip, "pm2 logs " + process_name + " --lines 50 --nostream 2>&1");
            res.json({ success: true, data: output });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async fsList(req, res) {
        try {
            const { server_id } = req.params;
            const { path = '/var/www/' } = req.body;
            const srv = await db.query('SELECT ip FROM infrastructure_servers WHERE id = $1', [server_id]);
            if (srv.rows.length === 0) return res.status(404).json({ success: false, error: 'Server not found' });
            const cmd = 'python3 -c "import os,json,stat; items=[]; path=\'' + path + '\'; [items.append({\"name\":f,\"isDir\":os.path.isdir(os.path.join(path,f)),\"size\":os.path.getsize(os.path.join(path,f))}) for f in os.listdir(path)]; print(json.dumps(sorted(items,key=lambda x:(not x[\"isDir\"],x[\"name\"]))))"';
            const output = await execRemoteSSH(srv.rows[0].ip, cmd);
            try {
                res.json({ success: true, data: JSON.parse(output) });
            } catch (e) { res.json({ success: true, data: [] }); }
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async fsRead(req, res) {
        try {
            const { server_id } = req.params;
            const { file_path } = req.body;
            const srv = await db.query('SELECT ip FROM infrastructure_servers WHERE id = $1', [server_id]);
            if (srv.rows.length === 0) return res.status(404).json({ success: false, error: 'Server not found' });
            const output = await execRemoteSSH(srv.rows[0].ip, 'cat ' + file_path);
            res.json({ success: true, data: output });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async fsWrite(req, res) {
        try {
            const { server_id } = req.params;
            const { file_path, content } = req.body;
            const srv = await db.query('SELECT ip FROM infrastructure_servers WHERE id = $1', [server_id]);
            if (srv.rows.length === 0) return res.status(404).json({ success: false, error: 'Server not found' });
            const base64Content = Buffer.from(content).toString('base64');
            await execRemoteSSH(srv.rows[0].ip, 'echo "' + base64Content + '" | base64 -d > ' + file_path);
            res.json({ success: true, message: 'File saved' });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async auditIntegrity(req, res) {
        try {
            console.log("Starting full auto-discovery and synchronization...");
            const servers = (await db.query('SELECT id, name, ip FROM infrastructure_servers')).rows;
            
            // 1. AUTO-DESCUBRIMIENTO Y REGISTRO EN TIEMPO REAL
            for (const srv of servers) {
                try {
                    // Buscar todos los archivos .env en /root/clients/
                    const findOutput = await execRemoteSSH(srv.ip, 'find /root/clients/ -maxdepth 3 -name ".env" 2>/dev/null');
                    if (!findOutput) continue;
                    
                    const envPaths = findOutput.split('\n').filter(p => p.trim().length > 0);
                    for (const envPath of envPaths) {
                        try {
                            const pathParts = envPath.split('/');
                            const clientName = pathParts[pathParts.length - 2];
                            
                            const dbCnnLine = await execRemoteSSH(srv.ip, `grep "^DB_CNN=" ${envPath} || true`);
                            const portLine = await execRemoteSSH(srv.ip, `grep "^PORT=" ${envPath} || true`);
                            
                            if (!dbCnnLine || !dbCnnLine.includes('mongodb')) continue;
                            
                            const connectionString = dbCnnLine.replace('DB_CNN=', '').replace(/'/g, '').replace(/"/g, '').trim();
                            const portStr = portLine.replace('PORT=', '').trim();
                            const port = portStr ? parseInt(portStr) : null;
                            
                            // Parsear conexión MongoDB
                            const match = connectionString.match(/mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@([^/]+)\/([^?]+)/);
                            if (!match) continue;
                            
                            const host = match[1];
                            const dbName = match[2];
                            const baseUri = connectionString.split('/').slice(0, 3).join('/') + '/';
                            
                            // Verificar/Registrar Cluster si es nuevo
                            let clusterId;
                            let clusterName;
                            const clusterCheck = await db.query(
                                "SELECT id, name FROM infrastructure_clusters WHERE host = $1 OR uri LIKE $2",
                                [host, `%@${host}%`]
                            );
                            if (clusterCheck.rows.length > 0) {
                                clusterId = clusterCheck.rows[0].id;
                                clusterName = clusterCheck.rows[0].name;
                            } else {
                                clusterName = host.split('.')[0] + '_auto';
                                const insRes = await db.query(
                                    "INSERT INTO infrastructure_clusters (name, host, uri, status) VALUES ($1, $2, $3, 'active') RETURNING id",
                                    [clusterName, host, baseUri]
                                );
                                clusterId = insRes.rows[0].id;
                            }
                            
                            // Verificar si el cliente existe en el CRM
                            const clientCheck = await db.query("SELECT id FROM infrastructure_pos_clients WHERE name = $1", [clientName]);
                            if (clientCheck.rows.length === 0) {
                                // Buscar dominio en Nginx
                                const nginxData = await execRemoteSSH(srv.ip, `grep -h "server_name" /etc/nginx/sites-enabled/*${clientName}* 2>/dev/null || grep -h "server_name" /etc/nginx/sites-enabled/* 2>/dev/null | grep ${clientName} || true`);
                                let domain = `${clientName}.poslatino.com`;
                                if (nginxData) {
                                    const domMatch = nginxData.match(/server_name\s+([^;]+);/);
                                    if (domMatch) domain = domMatch[1].trim().split(' ')[0];
                                }
                                
                                await db.query(
                                    `INSERT INTO infrastructure_pos_clients 
                                     (name, domain, server_id, server_name, cluster_id, cluster_name, db_name, port, status, has_link, has_system, has_db, created_at, updated_at) 
                                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', true, true, true, NOW(), NOW())`,
                                    [clientName, domain, srv.id, srv.name, clusterId, clusterName, dbName, port]
                                );
                            } else {
                                // Actualizar campos en caliente por si cambiaron de puerto/servidor/db
                                await db.query(
                                    `UPDATE infrastructure_pos_clients 
                                     SET server_id = $1, server_name = $2, cluster_id = $3, cluster_name = $4, db_name = $5, port = $6
                                     WHERE name = $7`,
                                    [srv.id, srv.name, clusterId, clusterName, dbName, port, clientName]
                                );
                            }
                        } catch (err) {
                            console.error(`Error procesando ruta ${envPath}:`, err.message);
                        }
                    }
                } catch (srvErr) {
                    console.error(`Error escaneando servidor ${srv.name}:`, srvErr.message);
                }
            }

            // 2. AUDITORÍA DE ESTADO DE NGINX Y PM2
            const updatedClients = (await db.query('SELECT * FROM infrastructure_pos_clients')).rows;
            const serverAudits = {};
            
            await Promise.all(servers.map(async (srv) => {
                try {
                    const pm2List = await execRemoteSSH(srv.ip, "pm2 jlist 2>/dev/null | grep -o '\"name\":\"[^\"]*\"' | cut -d'\"' -f4 | paste -sd, -");
                    const nginxList = await execRemoteSSH(srv.ip, "ls /etc/nginx/sites-enabled/ 2>/dev/null");
                    serverAudits[srv.id] = { 
                        pm2: pm2List ? pm2List.split(',') : [], 
                        nginx: nginxList ? nginxList.split(/\s+/) : [] 
                    };
                } catch (e) { 
                    serverAudits[srv.id] = { pm2: [], nginx: [] }; 
                }
            }));
            
            const matrix = await Promise.all(updatedClients.map(async (client) => {
                const audit = serverAudits[client.server_id] || { pm2: [], nginx: [] };
                const has_link = audit.nginx.some(n => n.includes(client.name));
                const has_system = audit.pm2.some(p => p.includes(client.name));
                const has_db = !!client.db_name;
                
                await db.query(
                    'UPDATE infrastructure_pos_clients SET has_link = $1, has_system = $2, has_db = $3 WHERE id = $4',
                    [has_link, has_system, has_db, client.id]
                );
                
                return {
                    id: client.id, name: client.name, server_id: client.server_id,
                    status: { link: has_link, system: has_system, db: has_db }
                };
            }));
            
            res.json({ success: true, message: 'Auditoría y auto-descubrimiento completados con éxito en tiempo real.', data: matrix });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    // ==========================================
    // MONGODB EXPLORER API
    // ==========================================

    async mongoGetClusters(req, res) {
        try {
            const data = await db.query('SELECT id, name, host, tier, status FROM infrastructure_clusters ORDER BY name');
            res.json({ success: true, data: data.rows });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async mongoListDbs(req, res) {
        try {
            const { cluster_id } = req.params;
            const cluster = await db.query('SELECT uri FROM infrastructure_clusters WHERE id = $1', [cluster_id]);
            if (cluster.rows.length === 0) return res.status(404).json({ success: false, error: 'Cluster not found' });
            if (!cluster.rows[0].uri) return res.status(400).json({ success: false, error: 'Cluster URI is missing in database' });
            
            const client = new MongoClient(cluster.rows[0].uri);
            await client.connect();
            const adminDb = client.db('admin');
            const dbs = await adminDb.command({ listDatabases: 1 });
            await client.close();
            
            res.json({ success: true, data: dbs.databases.filter(d => !['admin', 'local', 'config'].includes(d.name)) });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async mongoListCollections(req, res) {
        try {
            const { cluster_id, db_name } = req.params;
            const cluster = await db.query('SELECT uri FROM infrastructure_clusters WHERE id = $1', [cluster_id]);
            if (cluster.rows.length === 0) return res.status(404).json({ success: false, error: 'Cluster not found' });
            
            const client = new MongoClient(cluster.rows[0].uri);
            await client.connect();
            const database = client.db(db_name);
            const collections = await database.listCollections().toArray();
            
            const enriched = await Promise.all(collections.map(async (col) => {
                const stats = await database.command({ collStats: col.name });
                return { name: col.name, count: stats.count, size: stats.size };
            }));
            
            await client.close();
            res.json({ success: true, data: enriched });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async mongoGetDocuments(req, res) {
        try {
            const { cluster_id, db_name, col_name } = req.params;
            const { page = 1, limit = 50, query = '{}' } = req.query;
            const cluster = await db.query('SELECT uri FROM infrastructure_clusters WHERE id = $1', [cluster_id]);
            if (cluster.rows.length === 0) return res.status(404).json({ success: false, error: 'Cluster not found' });
            
            const client = new MongoClient(cluster.rows[0].uri);
            await client.connect();
            const collection = client.db(db_name).collection(col_name);
            
            const filter = JSON.parse(query);
            const docs = await collection.find(filter)
                .sort({ _id: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .toArray();
            
            const total = await collection.countDocuments(filter);
            
            await client.close();
            res.json({ success: true, data: docs, total, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async mongoUpdateDocument(req, res) {
        try {
            const { cluster_id, db_name, col_name, doc_id } = req.params;
            const { updateData } = req.body;
            const cluster = await db.query('SELECT uri FROM infrastructure_clusters WHERE id = $1', [cluster_id]);
            if (cluster.rows.length === 0) return res.status(404).json({ success: false, error: 'Cluster not found' });
            
            const client = new MongoClient(cluster.rows[0].uri);
            await client.connect();
            const collection = client.db(db_name).collection(col_name);
            
            // Clean update data of _id to avoid immutability error
            delete updateData._id;
            
            const result = await collection.updateOne(
                { _id: doc_id.length === 24 ? new ObjectId(doc_id) : doc_id },
                { $set: updateData }
            );
            
            await client.close();
            res.json({ success: true, result });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async mongoDeleteDocument(req, res) {
        try {
            const { cluster_id, db_name, col_name, doc_id } = req.params;
            const cluster = await db.query('SELECT uri FROM infrastructure_clusters WHERE id = $1', [cluster_id]);
            if (cluster.rows.length === 0) return res.status(404).json({ success: false, error: 'Cluster not found' });
            
            const client = new MongoClient(cluster.rows[0].uri);
            await client.connect();
            const collection = client.db(db_name).collection(col_name);
            
            const result = await collection.deleteOne({ 
                _id: doc_id.length === 24 ? new ObjectId(doc_id) : doc_id 
            });
            
            await client.close();
            res.json({ success: true, result });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }
    async mongoGetDbActivity(req, res) {
        try {
            const { cluster_id, db_name } = req.params;
            const cluster = await db.query('SELECT uri FROM infrastructure_clusters WHERE id = $1', [cluster_id]);
            if (cluster.rows.length === 0) return res.status(404).json({ success: false, error: 'Cluster not found' });
            
            const client = new MongoClient(cluster.rows[0].uri);
            await client.connect();
            const database = client.db(db_name);
            const collections = await database.listCollections().toArray();
            const colNames = collections.map(c => c.name);
            
            let lastActivity = null;
            
            if (colNames.includes('invoices')) {
                const latest = await database.collection('invoices').find({}).sort({ fecha: -1 }).limit(1).toArray();
                if (latest[0]) lastActivity = latest[0].fecha;
            } else if (colNames.includes('logproducts')) {
                const latest = await database.collection('logproducts').find({}).sort({ fecha: -1 }).limit(1).toArray();
                if (latest[0]) lastActivity = latest[0].fecha;
            }
            
            await client.close();
            res.json({ success: true, lastActivity });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

    async backupClient(req, res) {
        try {
            const { id } = req.params;
            const clientQuery = await db.query(
                'SELECT name, db_name, cluster_name FROM infrastructure_pos_clients WHERE id = $1',
                [id]
            );
            
            if (clientQuery.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Client not found' });
            }
            
            const clientInfo = clientQuery.rows[0];
            const { name: clientSubdomain, db_name: dbName, cluster_name: clusterName } = clientInfo;
            
            if (!dbName || !clusterName) {
                return res.status(400).json({ success: false, error: 'Client has no database or cluster assigned' });
            }
            
            const clusterQuery = await db.query(
                'SELECT uri FROM infrastructure_clusters WHERE name = $1',
                [clusterName]
            );
            
            if (clusterQuery.rows.length === 0 || !clusterQuery.rows[0].uri) {
                return res.status(404).json({ success: false, error: 'Cluster connection string not found' });
            }
            
            const mongoUri = clusterQuery.rows[0].uri;
            const mongoClient = new MongoClient(mongoUri);
            await mongoClient.connect();
            const database = mongoClient.db(dbName);
            
            const collections = await database.listCollections().toArray();
            const backupData = {
                metadata: {
                    client: clientSubdomain,
                    database: dbName,
                    cluster: clusterName,
                    backup_date: new Date().toISOString(),
                    schema_version: "2.0.0"
                },
                collections: {}
            };
            
            for (const col of collections) {
                const docs = await database.collection(col.name).find({}).toArray();
                backupData.collections[col.name] = docs;
            }
            
            await mongoClient.close();
            
            const backupDir = '/root/backups';
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            const filename = `backup_${clientSubdomain}_${Date.now()}.json`;
            const filepath = path.join(backupDir, filename);
            fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');
            
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(backupData, null, 2));
            
        } catch (error) {
            console.error('Error generating backup:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async restoreClient(req, res) {
        try {
            const { id } = req.params;
            const { backupData } = req.body;
            
            if (!backupData || !backupData.collections) {
                return res.status(400).json({ success: false, error: 'Formato de respaldo inválido o vacío' });
            }
            
            const clientQuery = await db.query(
                'SELECT name, db_name, cluster_name FROM infrastructure_pos_clients WHERE id = $1',
                [id]
            );
            
            if (clientQuery.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Client not found' });
            }
            
            const clientInfo = clientQuery.rows[0];
            const { db_name: dbName, cluster_name: clusterName } = clientInfo;
            
            if (!dbName || !clusterName) {
                return res.status(400).json({ success: false, error: 'Client has no database or cluster assigned' });
            }
            
            const clusterQuery = await db.query(
                'SELECT uri FROM infrastructure_clusters WHERE name = $1',
                [clusterName]
            );
            
            if (clusterQuery.rows.length === 0 || !clusterQuery.rows[0].uri) {
                return res.status(404).json({ success: false, error: 'Cluster connection string not found' });
            }
            
            const mongoUri = clusterQuery.rows[0].uri;
            const mongoClient = new MongoClient(mongoUri);
            await mongoClient.connect();
            const database = mongoClient.db(dbName);
            
            for (const [colName, docs] of Object.entries(backupData.collections)) {
                if (!Array.isArray(docs)) continue;
                
                try {
                    await database.collection(colName).drop();
                } catch (dropErr) {
                    // Ignore error if collection does not exist
                }
                
                if (docs.length > 0) {
                    const parsedDocs = docs.map(doc => {
                        return JSON.parse(JSON.stringify(doc), (key, value) => {
                            if (value && typeof value === 'object' && value.$oid) {
                                return new ObjectId(value.$oid);
                            }
                            if (key === '_id' && typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
                                return new ObjectId(value);
                            }
                            if (value && typeof value === 'object' && value.$date) {
                                return new Date(value.$date);
                            }
                            return value;
                        });
                    });
                    await database.collection(colName).insertMany(parsedDocs);
                }
            }
            
            await mongoClient.close();
            res.json({ success: true, message: 'Database successfully restored from backup' });
            
        } catch (error) {
            console.error('Error restoring backup:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async deleteClient(req, res) {
        try {
            const { id } = req.params;
            const { dropDatabase } = req.body;
            
            const clientData = await db.query('SELECT name, db_name, cluster_name, server_id FROM infrastructure_pos_clients WHERE id = $1', [id]);
            if (clientData.rows.length === 0) return res.status(404).json({ success: false, error: 'Client not found' });
            
            const client = clientData.rows[0];

            // 1. LIMPIEZA DE SERVIDOR VPS (PM2 y Nginx Link)
            if (client.server_id) {
                try {
                    const serverQuery = await db.query('SELECT ip FROM infrastructure_servers WHERE id = $1', [client.server_id]);
                    if (serverQuery.rows.length > 0) {
                        const ip = serverQuery.rows[0].ip;
                        const cleanCmd = `pm2 delete ${client.name} 2>/dev/null; pm2 save; rm -f /etc/nginx/sites-enabled/*${client.name}*; rm -f /etc/nginx/sites-available/*${client.name}*; nginx -t && systemctl reload nginx`;
                        await execRemoteSSH(ip, cleanCmd);
                    }
                } catch (sshError) {
                    console.error(`Error de limpieza SSH para ${client.name}:`, sshError.message);
                }
            }

            // 2. LIMPIEZA DE BASE DE DATOS (MongoDB)
            if (dropDatabase && client.db_name) {
                try {
                    const cluster = await db.query('SELECT uri FROM infrastructure_clusters WHERE name = $1', [client.cluster_name]);
                    if (cluster.rows.length > 0) {
                        const mongoClient = new MongoClient(cluster.rows[0].uri);
                        await mongoClient.connect();
                        await mongoClient.db(client.db_name).dropDatabase();
                        await mongoClient.close();
                    }
                } catch (dbError) {
                    console.error(`Error eliminando DB de ${client.name}:`, dbError.message);
                }
            }
            
            // 3. ELIMINACIÓN DE REGISTRO EN CRM (Tanto Técnico como Comercial)
            if (client.name) {
                await db.query('DELETE FROM crm_clients WHERE subdomain = $1', [client.name]);
            }
            await db.query('DELETE FROM infrastructure_pos_clients WHERE id = $1', [id]);
            res.json({ success: true, message: 'Client and infrastructure deleted successfully' });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }

}

export default new InfrastructureController();