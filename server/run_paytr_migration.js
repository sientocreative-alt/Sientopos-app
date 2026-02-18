require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, 'paytr_migration.sql'), 'utf8');
        await client.query(sql);
        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
};

runMigration();
