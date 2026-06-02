const http = require('http');

const options = {
    hostname: 'localhost',
    port: 4050,
    path: '/api/infrastructure/stats',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3OTkzMTI4OSwiZXhwIjoxNzgwMDE3Njg5fQ.MGEYBWVcSZwveCbznZ7pH78zrKwBExdzjnCygPPQwlA'
    }
};

const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => { console.log('Response:', data); });
});

req.on('error', error => {
    console.error('Error:', error);
});

req.end();
