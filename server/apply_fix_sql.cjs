
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function applySql() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('No DATABASE_URL');
        return;
    }

    const client = new Client({ connectionString: dbUrl });

    try {
        await client.connect();

        const sqlPath = path.join(__dirname, 'supabase/migrations/20260208000500_fix_stats_function.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying SQL...');
        await client.query(sql);
        console.log('SQL Applied successfully.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

applySql();
