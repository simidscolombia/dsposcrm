const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const FOLDER_NAME = 'mekatikos';
const MONGO_URI = 'mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/?retryWrites=true&w=majority';
const LOCAL_DB_DIR = 'C:\\Users\\elkin\\OneDrive\\Escritorio\\mekatikos';

function traverseAndConvert(obj) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = traverseAndConvert(obj[i]);
        }
    } else if (obj !== null && typeof obj === 'object') {
        if (obj.$oid && typeof obj.$oid === 'string') {
            try {
                return new ObjectId(obj.$oid);
            } catch (e) {
                return obj;
            }
        } else if (obj.$date) {
            return new Date(obj.$date);
        } else {
            for (const key in obj) {
                obj[key] = traverseAndConvert(obj[key]);
            }
        }
    }
    return obj;
}

async function fixDatabase() {
    console.log('🌱 Re-subiendo base de datos con conversión recursiva de ObjectId/Date...');
    const dest = new MongoClient(MONGO_URI);
    try {
        await dest.connect();
        const destDb = dest.db('simids_' + FOLDER_NAME);

        const files = fs.readdirSync(LOCAL_DB_DIR).filter(f => f.endsWith('.json'));
        console.log(`Encontrados ${files.length} archivos JSON.`);

        for (const file of files) {
            const colNameMatch = file.match(/dspos\.(.+)\.json/);
            if (!colNameMatch) continue;
            const colName = colNameMatch[1];

            const filePath = path.join(LOCAL_DB_DIR, file);
            console.log(`⏳ Leyendo y procesando ${file}...`);
            const rawData = fs.readFileSync(filePath, 'utf8');
            let docs = [];
            try {
                if (rawData.trim().startsWith('[')) {
                    docs = JSON.parse(rawData);
                } else {
                    docs = rawData.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
                }
            } catch (e) {
                console.error(`❌ Error parseando ${file}:`, e.message);
                continue;
            }

            if (docs.length > 0) {
                docs = traverseAndConvert(docs);

                await destDb.collection(colName).deleteMany({});
                
                const chunkSize = 5000;
                for (let i = 0; i < docs.length; i += chunkSize) {
                    const chunk = docs.slice(i, i + chunkSize);
                    await destDb.collection(colName).insertMany(chunk);
                }
                console.log(`  ✅ ${colName}: ${docs.length} docs subidos.`);
            } else {
                console.log(`  ⚪ ${colName}: 0 docs (ignorado).`);
            }
        }
        console.log('✅ Base de datos restaurada y corregida completamente.');
    } finally {
        await dest.close();
    }
}

fixDatabase().catch(e => console.error(e));
