import db from './src/config/database.js';
import fs from 'fs';

async function run() {
    let md = '';
    const log = (msg) => {
        md += msg + '\n';
        console.log(msg);
    };

    try {
        log('# Reporte de Auditoría de Infraestructura y Datos Centrales');
        log(`*Generado el: ${new Date().toLocaleString()}*\n`);

        log('## 1. Tablas Disponibles en Base de Datos');
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' 
            ORDER BY table_name
        `);
        log(`\`${tables.rows.map(r => r.table_name).join(', ')}\`\n`);

        log('## 2. Servidores Activos en la Nube');
        const servers = await db.query('SELECT * FROM infrastructure_servers ORDER BY id');
        log('| ID | Nombre | IP | Proveedor | Total Clientes | Estado |');
        log('|----|--------|----|-----------|----------------|--------|');
        servers.rows.forEach(s => {
            log(`| ${s.id} | ${s.name} | \`${s.ip}\` | ${s.provider} | **${s.total_clients}** | \`${s.status}\` |`);
        });
        log('\n');

        // Check tables for clusters
        const hasClustersTable = tables.rows.some(r => r.table_name === 'infrastructure_mongo_clusters');
        const hasClustersAltTable = tables.rows.some(r => r.table_name === 'infrastructure_clusters');
        let clusterTable = hasClustersTable ? 'infrastructure_mongo_clusters' : (hasClustersAltTable ? 'infrastructure_clusters' : '');

        if (clusterTable) {
            log(`## 3. Clusters MongoDB (${clusterTable})`);
            const clusters = await db.query(`SELECT * FROM ${clusterTable} ORDER BY id`);
            log('| ID | Nombre | URI/Host | Estado |');
            log('|----|--------|----------|--------|');
            clusters.rows.forEach(c => {
                log(`| ${c.id} | ${c.name} | \`${c.host || c.connection_uri || 'N/A'}\` | \`${c.status || 'active'}\` |`);
            });
            log('\n');
        }

        log('## 4. Distribución de Clientes por Servidor');
        const clientsByServer = await db.query(`
            SELECT s.name as server_name, COUNT(c.id) as count 
            FROM infrastructure_pos_clients c
            LEFT JOIN infrastructure_servers s ON c.server_id = s.id
            GROUP BY s.name 
            ORDER BY count DESC
        `);
        log('| Servidor | Clientes Detectados |');
        log('|----------|---------------------|');
        clientsByServer.rows.forEach(c => {
            log(`| ${c.server_name || 'Sin Servidor'} | **${c.count}** |`);
        });
        log('\n');

        log('## 5. Clientes sin Uso / Vacíos / Inactivos (Menos de 0.5 MB)');
        const inactiveClients = await db.query(`
            SELECT id, name, domain, db_size_mb, status, has_db
            FROM infrastructure_pos_clients 
            WHERE db_size_mb < 0.5 OR status = 'empty_db' OR db_size_mb IS NULL
            ORDER BY db_size_mb ASC
        `);
        log(`> [!NOTE]\n> Se detectaron **${inactiveClients.rows.length}** clientes con bases de datos vacías o con tamaño insignificante (< 0.5 MB), lo que sugiere que son instalaciones demo sin operar o nubes retiradas.\n`);
        log('| ID | Razón Social | Subdominio | Tamaño DB | Estado Check |');
        log('|----|--------------|------------|-----------|--------------|');
        inactiveClients.rows.slice(0, 40).forEach(c => {
            log(`| ${c.id} | ${c.name} | \`${c.domain || 'N/A'}\` | ${(parseFloat(c.db_size_mb || 0)).toFixed(2)} MB | \`${c.status || 'N/A'}\` |`);
        });
        log('*... (Listado truncado a los primeros 40 por legibilidad)*\n');

        log('## 6. Clientes con Triple Check Caído (Nginx, PM2 y DB Inactivos)');
        const criticalClients = await db.query(`
            SELECT id, name, domain, status, has_link, has_system, has_db 
            FROM infrastructure_pos_clients 
            WHERE has_link = false AND has_system = false AND has_db = false
            ORDER BY name
        `);
        log(`> [!WARNING]\n> Se identificaron **${criticalClients.rows.length}** clientes cuyos servicios de red (Nginx), servidor de procesos (PM2) y base de datos (MongoDB) están 100% desconectados o inactivos.\n`);
        log('| ID | Razón Social | Subdominio | Estado |');
        log('|----|--------------|------------|--------|');
        criticalClients.rows.slice(0, 30).forEach(c => {
            log(`| ${c.id} | ${c.name} | \`${c.domain || 'N/A'}\` | \`${c.status || 'N/A'}\` |`);
        });
        log('*... (Listado truncado a los primeros 30 por legibilidad)*\n');

        log('## 7. Bases de Datos Duplicadas (Nombre de DB Repetido)');
        const duplicateDbs = await db.query(`
            SELECT db_name, COUNT(*) as count, ARRAY_AGG(name) as names
            FROM infrastructure_pos_clients 
            WHERE db_name IS NOT NULL AND db_name != '' AND db_name != 'admin' AND db_name != 'local'
            GROUP BY db_name 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);
        log(`Se encontraron **${duplicateDbs.rows.length}** casos de bases de datos con nombres idénticos o repetidos.\n`);
        log('| Nombre DB | Repeticiones | Clientes que la Comparten |');
        log('|-----------|--------------|---------------------------|');
        duplicateDbs.rows.slice(0, 20).forEach(d => {
            log(`| \`${d.db_name}\` | **${d.count}** | ${d.names.join(', ')} |`);
        });
        log('\n');

        log('## 8. Subdominios Duplicados (Mismo Dominio en Nginx)');
        const duplicateDomains = await db.query(`
            SELECT domain, COUNT(*) as count, ARRAY_AGG(name) as names
            FROM infrastructure_pos_clients 
            WHERE domain IS NOT NULL AND domain != ''
            GROUP BY domain 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);
        log(`Se encontraron **${duplicateDomains.rows.length}** subdominios configurados múltiples veces en la infraestructura.\n`);
        log('| Subdominio | Repeticiones | Clientes Asignados |');
        log('|------------|--------------|--------------------|');
        duplicateDomains.rows.slice(0, 20).forEach(d => {
            log(`| \`${d.domain}\` | **${d.count}** | ${d.names.join(', ')} |`);
        });
        log('\n');

        log('## 9. Comparación Cruzada: CRM Comercial vs Infraestructura');
        const totalCrm = await db.query('SELECT COUNT(*) FROM crm_clients');
        const totalInfra = await db.query('SELECT COUNT(*) FROM infrastructure_pos_clients');
        const synced = await db.query('SELECT COUNT(*) FROM crm_clients WHERE infra_client_id IS NOT NULL');
        const pending = parseInt(totalInfra.rows[0].count) - parseInt(synced.rows[0].count);

        log(`- **Clientes en CRM (Fichas Comerciales):** ${totalCrm.rows[0].count}`);
        log(`- **Clientes Detectados en Servidores (Infraestructura Nube):** ${totalInfra.rows[0].count}`);
        log(`- **Clientes Sincronizados (Vinculados):** ${synced.rows[0].count}`);
        log(`- **Clientes Pendientes por Sincronizar / Aprobar:** **${pending}**`);

        fs.writeFileSync('audit_report.md', md);
        console.log("✅ Reporte escrito con éxito en audit_report.md");

    } catch (error) {
        console.error('Error during audit execution:', error);
    } finally {
        process.exit(0);
    }
}

run();
