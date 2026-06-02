const { MongoClient } = require('mongodb');

const SRC_URI = 'mongodb+srv://simids6:Simids2024*@simids6.mjkgn.mongodb.net/clubdeportivoturin?retryWrites=true&w=majority';
const DEST_URI = 'mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/simids_clubdeportivoturin2?retryWrites=true&w=majority';

async function run() {
    console.log('🔄 Iniciando copia de datos...');
    const srcClient = new MongoClient(SRC_URI);
    const destClient = new MongoClient(DEST_URI);
    
    try {
        await srcClient.connect();
        await destClient.connect();
        
        const srcDb = srcClient.db('clubdeportivoturin');
        const destDb = destClient.db('simids_clubdeportivoturin2');
        
        const collectionsToCopy = ['products', 'departments'];
        
        for (const colName of collectionsToCopy) {
            console.log(`⏳ Leyendo '${colName}' de clubdeportivoturin...`);
            const docs = await srcDb.collection(colName).find({}).toArray();
            console.log(`  Encontrados ${docs.length} registros en '${colName}'.`);
            
            if (docs.length > 0) {
                console.log(`  Borrando registros antiguos en el destino...`);
                await destDb.collection(colName).deleteMany({});
                
                console.log(`  Insertando nuevos registros...`);
                await destDb.collection(colName).insertMany(docs);
                console.log(`  ✅ '${colName}' copiada con éxito.`);
            } else {
                console.log(`  ⚪ La colección '${colName}' está vacía en el origen.`);
            }
        }
        console.log('🎉 Proceso completado.');
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await srcClient.close();
        await destClient.close();
    }
}

run();
