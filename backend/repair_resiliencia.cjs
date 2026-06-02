const { MongoClient } = require('mongodb');
const { Client } = require('pg');

async function repair() {
  const mongoUri = 'mongodb://restaurantes:Rp96sjhyiYsUsJeC@ac-rwykscz-shard-00-00.rzc5oqb.mongodb.net:27017,ac-rwykscz-shard-00-01.rzc5oqb.mongodb.net:27017,ac-rwykscz-shard-00-02.rzc5oqb.mongodb.net:27017/db_simids_admin?authSource=admin&replicaSet=atlas-74652y-shard-0&retryWrites=true&w=majority&ssl=true';
  const mongoClient = new MongoClient(mongoUri);

  try {
    console.log('--- Iniciando Reparación: Molde simids_demo ---');
    await mongoClient.connect();

    // 1. Borrar dbs erróneas o incompletas
    try { await mongoClient.db('simids_recilencia').dropDatabase(); console.log('🗑️ recilencia (C) eliminada'); } catch(e){}
    try { await mongoClient.db('simids_resiliencia').dropDatabase(); console.log('🗑️ resiliencia (S) eliminada'); } catch(e){}

    // 2. Clonar desde simids_demo
    const sourceDb = mongoClient.db('simids_demo');
    const targetDb = mongoClient.db('simids_resiliencia');
    
    const collections = await sourceDb.listCollections().toArray();
    for (const col of collections) {
      if (col.name.startsWith('system.')) continue;
      const docs = await sourceDb.collection(col.name).find({}).toArray();
      if (docs.length > 0) {
          await targetDb.collection(col.name).insertMany(docs);
          console.log(`✅ Copiada: ${col.name} (${docs.length} docs)`);
      } else {
          await targetDb.createCollection(col.name);
          console.log(`✅ Creada vacía: ${col.name}`);
      }
    }
    
    console.log('--- REPARACIÓN COMPLETADA ---');
    console.log('Acceso: https://resiliencia.simids.app');
  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await mongoClient.close();
  }
}
repair();
