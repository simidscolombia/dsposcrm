const { Client } = require('pg');

const urls = [
    'postgresql://postgres:SimidsCRM2026!@24.144.114.69:5432/simids_crm',
    'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
];

async function testConnection(url) {
    console.log(`Testing: ${url}`);
    const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
    try {
        await client.connect();
        console.log(`✅ Success connecting to: ${url}`);
        const res = await client.query('SELECT NOW()');
        console.log('Query output:', res.rows[0]);
        await client.end();
        return true;
    } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
        return false;
    }
}

async function main() {
    for (const url of urls) {
        await testConnection(url);
    }
    process.exit(0);
}

main();
