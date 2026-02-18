require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSettings() {
    console.log('Checking payment_settings...');
    const { data: settings, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('provider', 'iyzico');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(settings, null, 2));
    settings.forEach(s => {
        console.log('--- Iyzico Settings ---');
        console.log('Mode:', s.mode);
        console.log('API Key Length:', s.api_key ? s.api_key.length : 0);
        console.log('Secret Key Length:', s.secret_key ? s.secret_key.length : 0);
        console.log('API Key First 4:', s.api_key ? s.api_key.substring(0, 4) : 'N/A');
        console.log('Is API Key Empty String?:', s.api_key === "");
        console.log('Environment IYZICO_API_KEY:', process.env.IYZICO_API_KEY ? 'Present' : 'Missing');
    });
}

checkSettings();
