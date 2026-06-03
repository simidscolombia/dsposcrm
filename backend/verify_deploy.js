const http = require('http');

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch(e) { reject(new Error('Invalid JSON: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // 1. Login
  console.log('=== Verificando Deploy CRM ===');
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 4050, path: '/api/auth/login',
    method: 'POST', headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'admin', password: '123456' }));
  
  if (!loginRes.token) {
    console.log('ERROR: Login failed', loginRes);
    return;
  }
  console.log('Login OK - Token obtenido');

  // 2. Cross-check
  const crossRes = await makeRequest({
    hostname: 'localhost', port: 4050, path: '/api/billing/cross-check',
    headers: { 'Authorization': 'Bearer ' + loginRes.token }
  });

  console.log('success:', crossRes.success);
  if (crossRes.stats) {
    console.log('--- ESTADISTICAS ---');
    console.log('Total Clientes Cloud:', crossRes.stats.total_clients);
    console.log('Al dia:', crossRes.stats.al_dia);
    console.log('En mora:', crossRes.stats.en_mora);
    console.log('Sin facturar:', crossRes.stats.sin_facturar);
    console.log('Sin meses:', crossRes.stats.sin_meses);
    console.log('Facturas libres:', (crossRes.unlinkedInvoices || []).length);
    console.log('--- PRIMEROS 5 CLIENTES ---');
    (crossRes.report || []).slice(0, 5).forEach(r => {
      console.log(' -', r.business_name, '|', r.cloud_url, '| status:', r.status_check, '| facturas:', (r.invoices || []).length);
    });
  } else {
    console.log('ERROR:', crossRes.error || JSON.stringify(crossRes).substring(0, 300));
  }
  console.log('=== FIN ===');
}

main().catch(e => console.error('FATAL:', e.message));
