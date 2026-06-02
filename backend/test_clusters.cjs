const { MongoClient } = require('mongodb');

async function testCluster(uri, name) {
    console.log(`\nTesting cluster: ${name}`);
    const client = new MongoClient(uri, { connectTimeoutMS: 5000, socketTimeoutMS: 5000 });
    try {
        await client.connect();
        const adminDb = client.db().admin();
        const list = await adminDb.listDatabases();
        console.log(`✅ Success! Found ${list.databases.length} databases.`);
    } catch (e) {
        console.error(`❌ Error in ${name}:`, e.message);
    } finally {
        await client.close();
    }
}

(async () => {
    await testCluster('mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/?retryWrites=true&w=majority', 'restaurantes');
    await testCluster('mongodb+srv://simids6:Simids2024*@simids6.mjkgn.mongodb.net/?retryWrites=true&w=majority', 'simids6');
})();
