import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import db from '../src/config/database.js'; // Usa el pool configurado
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const detailedPath = path.join(__dirname, '../src/data/detailed_active_clients.json');
const precisePath = path.join(__dirname, '../src/data/precise_extracted_clients.json');

async function runMigration() {
    console.log('Iniciando migración de clientes Legacy a CRM...');
    
    if (!fs.existsSync(detailedPath) || !fs.existsSync(precisePath)) {
        console.error('No se encontraron los archivos JSON de Legacy.');
        process.exit(1);
    }

    const clientsData = JSON.parse(fs.readFileSync(detailedPath, 'utf-8'));
    const preciseData = JSON.parse(fs.readFileSync(precisePath, 'utf-8'));
    
    // Unificar info
    clientsData.forEach(client => {
        const preciseClient = preciseData.find(p => p.folderName === client.folderName);
        if (preciseClient && preciseClient.envVars) {
            client.envVars = preciseClient.envVars;
        }
    });

    console.log(`Total de clientes en JSON: ${clientsData.length}`);
    
    const consolidatedClients = {}; // key: NIT
    const batchSize = 25;
    console.log(`Procesando bases de datos de clientes en lotes de ${batchSize}...`);

    for (let i = 0; i < clientsData.length; i += batchSize) {
        const batch = clientsData.slice(i, i + batchSize);
        console.log(`Lote [${Math.floor(i/batchSize) + 1}/${Math.ceil(clientsData.length/batchSize)}] (Clientes ${i + 1} - ${Math.min(i + batchSize, clientsData.length)})...`);
        
        const batchResults = await Promise.all(batch.map(async (c, batchIdx) => {
            const idx = i + batchIdx + 1;
            if (!c.envVars || !c.envVars.DB_CNN) return null;

            let dbCnn = c.envVars.DB_CNN.replace(/\\&/g, '&').replace(/\\\\/g, '\\');
            const match = dbCnn.match(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)([^/?]*)(\??.*)$/);
            if (match) {
                dbCnn = match[1] + c.dbName + match[3];
            } else if (dbCnn.endsWith('/')) {
                dbCnn = dbCnn + c.dbName;
            }

            let clientNit = 'SIN-NIT-' + c.folderName;
            let hasFE = false;
            let clientName = c.folderName.toUpperCase();
            let clientPhone = null;
            let clientCity = null;

            const mongo = new MongoClient(dbCnn, { connectTimeoutMS: 3000, socketTimeoutMS: 3000 });
            try {
                await mongo.connect();
                const dbMongo = mongo.db(c.dbName);
                const datosColl = dbMongo.collection('datos');
                const dataRow = await datosColl.findOne({});
                
                if (dataRow) {
                    if (dataRow.nit) clientNit = dataRow.nit.toString().trim();
                    if (dataRow.name) clientName = dataRow.name;
                    if (dataRow.phone) clientPhone = dataRow.phone;
                    if (dataRow.city) clientCity = dataRow.city;
                    if (dataRow.fe === true || dataRow.fe === 'true' || dataRow.facturacion_electronica) {
                        hasFE = true;
                    }
                }
            } catch (err) {
                // Silencioso o un log corto
            } finally {
                try { await mongo.close(); } catch(e) {}
            }

            return {
                nit: clientNit,
                name: clientName,
                phone: clientPhone,
                city: clientCity,
                hasFE,
                domain: c.domain,
                cluster: c.cluster || 'N/A',
                dbName: c.dbName
            };
        }));

        // Consolidar resultados del lote
        for (const res of batchResults) {
            if (!res) continue;

            let plan_type = res.hasFE ? 'cloud_fe' : 'cloud';
            let amount = res.hasFE ? 55000 : 35000;
            let domain = 'https://' + res.domain;

            if (!consolidatedClients[res.nit]) {
                consolidatedClients[res.nit] = {
                    business_name: res.name,
                    nit: res.nit,
                    whatsapp: res.phone,
                    city: res.city,
                    urls: [domain],
                    plan_type: plan_type,
                    monthly_amount: amount,
                    cluster_id: res.cluster,
                    db_names: [res.dbName],
                    links_count: 1
                };
            } else {
                consolidatedClients[res.nit].urls.push(domain);
                consolidatedClients[res.nit].db_names.push(res.dbName);
                consolidatedClients[res.nit].links_count += 1;
                if (res.hasFE) {
                    consolidatedClients[res.nit].plan_type = 'cloud_fe';
                }
                consolidatedClients[res.nit].monthly_amount += amount;
            }
        }
    }

    console.log(`\nClientes consolidados por NIT: ${Object.keys(consolidatedClients).length}`);
    console.log('Asegurando tamaño de columnas...');
    try {
        await db.query('ALTER TABLE crm_clients ALTER COLUMN nit TYPE VARCHAR(100)');
        await db.query('ALTER TABLE crm_clients ALTER COLUMN whatsapp TYPE VARCHAR(100)');
        console.log('✅ Columnas nit y whatsapp ampliadas a VARCHAR(100).');
    } catch (e) {
        console.warn('⚠️ Advertencia al alterar columnas:', e.message);
    }

    let inserted = 0;
    let updated = 0;

    for (const nit of Object.keys(consolidatedClients)) {
        const client = consolidatedClients[nit];
        const combinedUrls = client.urls.join(', ');
        const combinedDbs = client.db_names.join(', ');

        const existing = await db.query('SELECT id FROM crm_clients WHERE nit = $1', [nit]);
        
        if (existing.rows.length > 0) {
            const id = existing.rows[0].id;
            await db.query(`
                UPDATE crm_clients 
                SET cloud_url = $1, plan_type = $2, monthly_amount = $3, is_active = true
                WHERE id = $4
            `, [combinedUrls, client.plan_type, client.monthly_amount, id]);
            updated++;
        } else {
            await db.query(`
                INSERT INTO crm_clients (
                    business_name, nit, whatsapp, city, cloud_url,
                    plan_type, monthly_amount, is_active, billing_start_date, next_billing_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '27 days')
            `, [
                client.business_name,
                nit,
                client.whatsapp || '570000000000',
                client.city,
                combinedUrls,
                client.plan_type,
                client.monthly_amount
            ]);
            inserted++;
        }
    }

    console.log(`Proceso finalizado. Insertados: ${inserted}, Actualizados: ${updated}.`);
    process.exit(0);
}

runMigration().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
