
const { MongoClient } = require('mongodb');
const pg = require('pg');
const fs = require('fs');

async function massCleanup() {
    let log = "INIT\n";
    const dbList = ['test', 'demo', 'aseo', 'blackdiamondshoes', 'guajaro', 'multielectricos', 'yea', 'crfvital', 'hpensilvaniap', 'outlet23'];
    const mongoUri = "mongodb+srv://simidscolombia:Z96KuEy9gqJ4TGzp@cluster0.dvs9h1z.mongodb.net/";
    
    try {
        const mongoClient = new MongoClient(mongoUri);
        await mongoClient.connect();
        log += "Mongo OK\n";
        for (const dbName of dbList) {
            await mongoClient.db(dbName).dropDatabase();
            log += "Dropped " + dbName + "\n";
        }
        await mongoClient.close();
    } catch (e) {
        log += "Mongo Error: " + e.message + "\n";
    }
    
    fs.writeFileSync('/tmp/log.txt', log);
}
massCleanup();
