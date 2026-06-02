const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function run() {
    try {
        const precisePath = path.join(__dirname, 'src', 'data', 'precise_extracted_clients.json');
        const data = JSON.parse(fs.readFileSync(precisePath, 'utf8'));

        console.log(`Loaded ${data.length} clients from JSON.`);
        
        // Find admin in clients list
        const adminClient = data.find(c => c.folderName.includes('admin') || c.domain.includes('admin'));
        if (adminClient) {
            console.log('Found admin client in JSON:', adminClient);
        } else {
            console.log('No admin client found in precise_extracted_clients.json.');
        }

        // Extract unique cluster URIs
        const clusters = new Set();
        data.forEach(p => {
            const uri = p.mongoUri || (p.envVars && p.envVars.DB_CNN);
            if (uri) {
                // Get base cluster URI
                const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+\/)/);
                if (match) clusters.add(match[1]);
            }
        });

        console.log(`\nFound ${clusters.size} unique clusters.`);

        let foundAdmin = [];
        for (const uri of clusters) {
            console.log(`Checking cluster: ${uri} ...`);
            const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
            try {
                await client.connect();
                const adminDb = client.db('admin');
                const dbs = await adminDb.command({ listDatabases: 1 });
                const adminMatches = dbs.databases.filter(d => 
                    d.name.toLowerCase().includes('admin') && 
                    !['admin', 'local', 'config'].includes(d.name)
                );

                if (adminMatches.length > 0) {
                    foundAdmin.push({
                        uri,
                        databases: adminMatches.map(d => d.name)
                    });
                }
                await client.close();
            } catch (err) {
                console.error(`  [!] Error connecting to ${uri}: ${err.message}`);
            }
        }

        console.log('\n--- MONGODB SEARCH RESULTS ---');
        if (foundAdmin.length > 0) {
            console.log(JSON.stringify(foundAdmin, null, 2));
        } else {
            console.log('No admin-like databases found across any Mongo clusters.');
        }

    } catch(e) {
        console.error(e);
    }
}

run();
