
import dotenv from 'dotenv';
import scraperService from '../backend/src/services/scraperService.js';
dotenv.config();

const testUrl = 'https://satpcs.com/sp/punto-de-venta-pos.html';

console.log('🧪 Iniciando prueba de scraping local...');

const scraper = scraperService.default; // Es export default

async function runTest() {
    try {
        const data = await scraper.scrapeProduct(testUrl);
        console.log('✅ ÉXITO! Datos extraídos:', data);
    } catch (error) {
        console.error('❌ FALLÓ:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

runTest();
