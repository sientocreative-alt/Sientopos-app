const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFilter() {
    const businessId = 'ac5b4f66-a768-45b6-ade1-6955a93e160e';
    console.log(`Checking filter for business_id: ${businessId}`);

    const { data, error } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('business_id', businessId);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Results: ${data.length}`);
        if (data.length > 0) {
            console.log('Record found!');
        } else {
            console.log('No record found with this filter.');

            // Try fetching all to see what IDs are actually there
            const { data: all } = await supabase.from('customer_feedback').select('business_id');
            console.log('Actual business_ids in DB:', all.map(r => r.business_id));
        }
    }
}

checkFilter();
