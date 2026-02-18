const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking schema with SERVICE ROLE KEY...');

    // insert a dummy row to test if sort_order is accepted
    // we use a transaction-like approach: insert then immediately delete
    // OR we just try to select

    const { data: selectData, error: selectError } = await supabase
        .from('seating_areas')
        .select('id')
        .limit(1);

    if (selectError) {
        console.error('Error selecting id:', selectError.message);
        return;
    }

    if (selectData && selectData.length > 0) {
        const id = selectData[0].id;
        console.log('Found ID:', id);

        const { data: updateData, error: updateError } = await supabase
            .from('seating_areas')
            .update({ sort_order: 1 })
            .eq('id', id)
            .select();

        if (updateError) {
            console.error('Error updating sort_order:', updateError.message);
        } else {
            console.log('SUCCESS: Updated sort_order for ID', id);
        }
    } else {
        console.log('No rows found to test update.');
    }
}

checkSchema();
