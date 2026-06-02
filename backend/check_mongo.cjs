const { MongoClient } = require('mongodb');

async function check() {
  const uri = 'mongodb://restaurantes:Rp96sjhyiYsUsJeC@ac-rwykscz-shard-00-00.rzc5oqb.mongodb.net:27017,ac-rwykscz-shard-00-01.rzc5oqb.mongodb.net:27017,ac-rwykscz-shard-00-02.rzc5oqb.mongodb.net:27017/db_simids_admin?authSource=admin&replicaSet=atlas-74652y-shard-0&retryWrites=true&w=majority&ssl=true';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('simids_demo');
    const cols = await db.listCollections().toArray();
    console.log('--- COLECCIONES EN SIMIDS_DEMO ---');
    console.log(cols.map(c => c.name));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
check();
