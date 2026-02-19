
import scraperService from '../backend/src/services/scraperService.js';
import dotenv from 'dotenv';
dotenv.config();

const testUrl = 'https://satpcs.com/sp/punto-de-venta-pos.html';

console.log('🧪 Iniciando prueba de scraping local...');

async function runTest() {
    try {
        const data = await scraperService.scrapeProduct(testUrl);
        console.log('✅ ÉXITO! Datos extraídos:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ FALLÓ:', error);
    }
}

runTest();
