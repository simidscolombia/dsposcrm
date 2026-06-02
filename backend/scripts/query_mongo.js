import { MongoClient } from 'mongodb';

async function run() {
    const uri = 'mongodb+srv://simidscolombia:Z96KuEy9gqJ4TGzp@cluster0.dvs9h1z.mongodb.net/';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('dspos');
        
        console.log('Connected to dspos mongo database.');
        const collections = await db.listCollections().toArray();
        console.log('Collections:');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(` - ${col.name}: ${count} documents`);
        }

        // Check if there is an invoices or sales collection
        const possibleSalesCols = ['invoices', 'ventas', 'sales', 'facturas'];
        for (const colName of possibleSalesCols) {
            if (collections.some(c => c.name === colName)) {
                console.log(`\nSample from collection "${colName}":`);
                const sample = await db.collection(colName).find({}).sort({ _id: -1 }).limit(2).toArray();
                console.log(JSON.stringify(sample, null, 2));
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

run();
