import axios from 'axios';

async function test() {
    try {
        console.log("Testing PM2 endpoint for Server03 (ID 3)...");
        const pm2Res = await axios.get('http://localhost:3000/api/infrastructure/pm2/3');
        console.log("PM2 Response:", pm2Res.status);
    } catch (e) {
        console.log("PM2 Error:", e.response ? e.response.status : e.message);
    }

    try {
        console.log("Testing Mongo endpoint for cluster0_u5yvx (ID 7)...");
        const mongoRes = await axios.get('http://localhost:3000/api/infrastructure/mongo/7/dbs');
        console.log("Mongo Response:", mongoRes.status);
    } catch (e) {
        console.log("Mongo Error:", e.response ? e.response.status : e.message);
    }
}

test();
