
import axios from 'axios';

async function initDB() {
    try {
        console.log('Calling init-tables endpoint...');
        const response = await axios.post('https://dspos.vercel.app/api/admin/init-tables');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

initDB();
