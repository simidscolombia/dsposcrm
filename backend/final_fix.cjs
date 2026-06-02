const { MongoClient } = require('mongodb');
const { Client } = require('pg');

async function fix() {
  const mongoUri = 'mongodb://restaurantes:Rp96sjhyiYsUsJeC@ac-rwykscz-shard-00-00.rzc5oqb.mongodb.net:27017,ac-rwykscz-shard-00-01.rzc5oqb.mongodb.net:27017,ac-rwykscz-shard-00-02.rzc5oqb.mongodb.net:27017/db_simids_admin?authSource=admin&replicaSet=atlas-74652y-shard-0&retryWrites=true&w=majority&ssl=true';
  const pgConfig = { connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm' };

  const pgClient = new Client(pgConfig);
  const mongoClient = new MongoClient(mongoUri);

  try {
    await pgClient.connect();
    await mongoClient.connect();

    // 1. Limpiar rastro de 'resiliencia' (S)
    await pgClient.query("DELETE FROM crm_clients WHERE subdomain = 'resiliencia'");
    try { await mongoClient.db('simids_resiliencia').dropDatabase(); console.log('🗑️ resiliencia (S) eliminada'); } catch(e){}

    // 2. Crear/Actualizar 'recilencia' (C)
    await pgClient.query("INSERT INTO crm_clients (business_name, subdomain, whatsapp, plan_type, is_active, monthly_amount, cloud_url) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (subdomain) DO UPDATE SET is_active = true", 
      ['Recilencia', 'recilencia', '3000000000', 'cloud', true, 50000, 'recilencia.simids.app']);
    console.log('✅ Registro en CRM actualizado a recilencia (C)');

    // 3. Clonar molde a 'recilencia'
    try { await mongoClient.db('simids_recilencia').dropDatabase(); } catch(e){}
    const sourceDb = mongoClient.db('simids_demo');
    const targetDb = mongoClient.db('simids_recilencia');
    
    const collections = await sourceDb.listCollections().toArray();
    for (const col of collections) {
      if (col.name.startsWith('system.')) continue;
      const docs = await sourceDb.collection(col.name).find({}).toArray();
      if (docs.length > 0) await targetDb.collection(col.name).insertMany(docs);
      else await targetDb.createCollection(col.name);
    }
    
    console.log('✅ Cliente RECILENCIA activado y clonado con éxito.');
    console.log('URL: https://recilencia.simids.app');
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await pgClient.end();
    await mongoClient.close();
  }
}
fix();
