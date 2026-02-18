const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFeedback() {
    console.log('Checking customer_feedback table...');
    const { data, error, count } = await supabase
        .from('customer_feedback')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} feedbacks (Total count: ${count})`);
        if (data.length > 0) {
            console.log('Last feedback:', data[0]);
        }
    }
}

checkFeedback();
