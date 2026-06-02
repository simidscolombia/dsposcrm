const jwt = require('jsonwebtoken');
const http = require('http');

const secret = 'simids_crm_secret_2026';
const payload = { id: 1, username: 'admin', role: 'admin' };
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('\n🚀 Enviando solicitud de creación de mekatikos...\n');

const postData = JSON.stringify({
    subdomain: 'mekatikos',
    cluster: 'restaurantes'
});

const options = {
    hostname: 'localhost',
    port: 4050,
    path: '/api/cloud/clients/create',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('📨 Respuesta de la API:');
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch(e) {
            console.log(data);
        }
        console.log('\n✅ La solicitud fue enviada al backend. El despliegue continuará en segundo plano.');
        console.log('Puedes ver los logs completos en la terminal del backend (o en la UI de Torre Cloud).');
    });
});

req.on('error', (e) => {
    console.error('❌ Error en la solicitud:', e.message);
});

req.write(postData);
req.end();
