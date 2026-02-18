const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceUpdate() {
    try {
        const apiKey = 'sandbox-VpWbvjn8UFWD8eCUXX9Xkf9wTGxSun6l';
        const secretKey = 'sandbox-oNwbKcYeWI4Bjjp7Fwd5IQ7DaPnh2cN0';

        console.log('Updating Iyzico Keys in DB...');
        const { error } = await supabase.from('payment_settings').upsert({
            provider: 'iyzico',
            api_key: apiKey,
            secret_key: secretKey,
            mode: 'sandbox',
            base_url: 'https://sandbox-api.iyzipay.com'
        }, { onConflict: 'provider' });

        if (error) {
            console.error('Update Failed:', error.message);
        } else {
            console.log('Update Success!');
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

forceUpdate();
