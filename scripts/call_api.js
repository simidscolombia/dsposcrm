
import axios from 'axios';

const API_URL = 'http://localhost:4050/api/products/analyze-url';
const targetUrl = 'https://satpcs.com/sp/punto-de-venta-pos.html';

console.log(`🌐 Probando API Scraper en: ${API_URL}`);
console.log(`🔗 Objetivo: ${targetUrl}`);

async function test() {
    try {
        const res = await axios.post(API_URL, { url: targetUrl });
        console.log('✅ RESPUESTA EXITOSA:', JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error('❌ ERROR API:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No hubo respuesta del servidor (¿Backend apagado?)');
        }
    }
}

test();
