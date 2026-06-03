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
        console.log('Fetching invoices from admin.poslatino.com...');
        const response = await adminAxios.get('/facturas/todas', {
            params: { desde: 0, limite: 15, venta: 'Cloud' }
        });
        
        console.log('Status Code:', response.status);
        console.log('Success:', response.data.ok);
        if (response.data.ok && response.data.facturas) {
            console.log('Total facturas found:', response.data.total);
            console.log('Facturas count returned:', response.data.facturas.length);
            if (response.data.facturas.length > 0) {
                console.log('First invoice structure:');
                console.log(JSON.stringify(response.data.facturas[0], null, 2));
                
                console.log('\nList of descriptions/observations from invoices:');
                response.data.facturas.forEach((f, idx) => {
                    console.log(`[${idx}] Num: ${f.numero}, Monto: ${f.monto}, Cliente: ${f.cliente?.nombre}, NIT: ${f.cliente?.nit}, Nota: "${f.nota || ''}"`);
                });
            }
        } else {
            console.log('Response:', response.data);
        }
    } catch (error) {
        console.error('Error fetching invoices:', error.message);
        if (error.response) {
            console.error('Response details:', error.response.status, error.response.data);
        }
    }
}

run();
