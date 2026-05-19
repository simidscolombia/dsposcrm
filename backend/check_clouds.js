import db from './src/config/database.js';

async function run() {
    try {
        console.log('=== ANALISIS DE SUBDOMINIOS CLOUD ===');
        
        const clouds = await db.query(`
            SELECT id, name, domain, db_size_mb, has_link, has_system, has_db, updated_at
            FROM infrastructure_pos_clients 
            WHERE name ILIKE 'cloud%' 
            ORDER BY name
        `);
        
        console.log(`Encontrados ${clouds.rows.length} registros que empiezan por "cloud"`);
        console.table(clouds.rows.map(c => ({
            ID: c.id,
            Nombre: c.name,
            Tamaño_MB: parseFloat(c.db_size_mb || 0).toFixed(2),
            Nginx: c.has_link,
            PM2: c.has_system,
            Mongo: c.has_db,
            Ultima_Audit: new Date(c.updated_at).toLocaleString()
        })));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

run();
