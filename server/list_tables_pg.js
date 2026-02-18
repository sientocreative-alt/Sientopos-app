const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL;

async function listTables() {
    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT tablename 
            FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public'
        `);
        console.log('Tables:', res.rows.map(r => r.tablename));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

listTables();
