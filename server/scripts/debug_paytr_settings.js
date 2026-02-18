require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkSettings() {
    console.log('Checking PayTR Settings in DB...');
    console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
    console.log('Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Supabase credentials missing in .env');
        return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', ['paytr_merchant_id', 'paytr_merchant_key', 'paytr_merchant_salt', 'paytr_test_mode']);

    if (error) {
        console.error('Error fetching settings:', error);
    } else {
        console.log('Settings found:', data);
        if (data.length === 0) {
            console.log('NO SETTINGS FOUND IN DB');
        } else {
            data.forEach(row => {
                console.log(`${row.key}: ${row.value ? (row.key.includes('key') || row.key.includes('salt') ? '******' : row.value) : 'EMPTY'}`);
            });
        }
    }
}

checkSettings();
