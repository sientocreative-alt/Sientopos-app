const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectData() {
    console.log('--- Feedback Data ---');
    const { data: feedbackData } = await supabase
        .from('customer_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (feedbackData && feedbackData.length > 0) {
        console.log('Latest Feedback Business ID:', feedbackData[0].business_id);
    } else {
        console.log('No feedback found.');
    }

    console.log('\n--- Business Data ---');
    const { data: businessData } = await supabase
        .from('businesses')
        .select('id, name');

    businessData.forEach(b => {
        console.log(`Business: ${b.name}, ID: ${b.id}`);
    });
}

inspectData();
