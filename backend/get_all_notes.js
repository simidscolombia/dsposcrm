import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.poslatino.com';
const CRM_TOKEN = process.env.ADMIN_CRM_TOKEN;

const adminAxios = axios.create({
    baseURL: `${ADMIN_URL}/api/crm`,
    timeout: 15000,
    headers: {
        'Authorization': `Bearer ${CRM_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

async function run() {
    try {
        console.log('Fetching all invoices from admin.poslatino.com...');
        const response = await adminAxios.get('/facturas/todas', {
            params: { desde: 0, limite: 1000, venta: 'Cloud' }
        });
        
        if (response.data.ok && response.data.facturas) {
            console.log('Total facturas found:', response.data.total);
            const nonRepeatedNotes = new Set();
            const sampleInvoices = [];
            
            response.data.facturas.forEach(f => {
                if (f.nota) {
                    const cleanNote = f.nota.trim();
                    if (!nonRepeatedNotes.has(cleanNote)) {
                        nonRepeatedNotes.add(cleanNote);
                        sampleInvoices.push(f);
                    }
                }
            });
            
            console.log(`Unique non-empty notes count: ${nonRepeatedNotes.size}`);
            sampleInvoices.forEach(f => {
                console.log(`Num: ${f.numero}, Cliente: ${f.cliente?.nombre}, NIT: ${f.cliente?.nit}, Nota: "${f.nota}"`);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
