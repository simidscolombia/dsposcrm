const { MongoClient } = require('mongodb');
const { Client } = require('pg');

async function deploy() {
  const mongoUri = 'mongodb://restaurantes:Rp96sjhyiYsUsJeC@ac-rwykscz-shard-00-00.rzc5oqb.mongodb.net:27017,ac-rwykscz-shard-00-01.rzc5oqb.mongodb.net:27017,ac-rwykscz-shard-00-02.rzc5oqb.mongodb.net:27017/db_simids_admin?authSource=admin&replicaSet=atlas-74652y-shard-0&retryWrites=true&w=majority&ssl=true';
  const pgConfig = {
    connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
  };

  const pgClient = new Client(pgConfig);
  const mongoClient = new MongoClient(mongoUri);

  try {
    console.log('--- Iniciando Despliegue: Resiliencia ---');
    await pgClient.connect();
    await mongoClient.connect();

    // 1. Insertar en Postgres (CRM)
    await pgClient.query('INSERT INTO crm_clients (business_name, subdomain, whatsapp, plan_type, is_active, monthly_amount, cloud_url) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (subdomain) DO UPDATE SET is_active = true', 
      ['Resiliencia', 'resiliencia', '3000000000', 'cloud', true, 50000, 'resiliencia.simids.app']);
    console.log('✅ Cliente registrado en CRM.');

    // 2. Clonar Mongo
    const sourceDb = mongoClient.db('dspos');
    const targetDb = mongoClient.db('simids_resiliencia');
    
    // Verificamos si existe
    const dbs = await mongoClient.db('admin').admin().listDatabases();
    if (dbs.databases.find(d => d.name === 'simids_resiliencia')) {
        console.log('⚠️ La DB simids_resiliencia ya existe. Procediendo solo con verificación.');
    } else {
        const collections = await sourceDb.listCollections().toArray();
        for (const col of collections) {
          if (col.name.startsWith('system.')) continue;
          const docs = await sourceDb.collection(col.name).find({}).toArray();
          if (docs.length > 0) await targetDb.collection(col.name).insertMany(docs);
          else await targetDb.createCollection(col.name);
        }
        console.log('✅ Base de datos clonada en Atlas (simids_resiliencia).');
    }
    
    console.log('--- PROCESO COMPLETADO ---');
    console.log('Link: https://resiliencia.simids.app');
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await pgClient.end();
    await mongoClient.close();
  }
}
deploy();
