import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://simidscolombia:Z96KuEy9gqJ4TGzp@cluster0.dvs9h1z.mongodb.net/dspos?retryWrites=true&w=majority";

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('dspos');
        const invoicesCol = db.collection('invoices');
        
        console.log('Connected to MongoDB.');
        
        // 1. Get unique values of the 'venta' field
        const uniqueVenta = await invoicesCol.distinct('venta');
        console.log('Unique "venta" values:', uniqueVenta);
        
        // 2. Count invoices by 'venta'
        for (const v of uniqueVenta) {
            const count = await invoicesCol.countDocuments({ venta: v });
            console.log(`Invoices count for venta "${v}":`, count);
        }
        
        // 3. Search for ANY invoice in the collection where 'nota' contains .poslatino or .com or .co
        console.log('\nSearching for invoices with potential domains or links in "nota"...');
        const query = {
            $or: [
                { nota: /poslatino/i },
                { nota: /\.com/i },
                { nota: /\.co/i },
                { observaciones: /poslatino/i },
                { observaciones: /\.com/i },
                { observaciones: /\.co/i }
            ]
        };
        const linkInvoicesCount = await invoicesCol.countDocuments(query);
        console.log('Invoices containing potential links:', linkInvoicesCount);
        
        const linkInvoices = await invoicesCol.find(query).limit(50).toArray();
        linkInvoices.forEach(inv => {
            console.log(`ID: ${inv._id}, Num: ${inv.invoice}, Cliente ID: ${inv.client}, Venta: "${inv.venta || ''}", Nota: "${inv.nota || ''}"`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

run();
