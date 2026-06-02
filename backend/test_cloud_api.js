const jwt = require('jsonwebtoken');
const http = require('http');

const secret = 'simids_crm_secret_2026';
const payload = { id: 1, username: 'admin', role: 'admin' };
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

const options = {
  hostname: 'localhost',
  port: 4050,
  path: '/api/cloud/instances',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Response (keys):', Object.keys(parsed));
      if (parsed.success) {
        console.log('Count:', parsed.count);
        console.log('Data type of parsed.data:', typeof parsed.data);
        if (Array.isArray(parsed.data)) {
          console.log('Data length:', parsed.data.length);
          if (parsed.data.length > 0) {
            console.log('Sample item:', JSON.stringify(parsed.data[0], null, 2));
          }
        } else {
          console.log('parsed.data is not an array:', parsed.data);
        }
      } else {
        console.log('Parsed response:', parsed);
      }
    } catch (e) {
      console.log('Failed to parse JSON:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
