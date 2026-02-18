
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from current directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStats() {
    console.log('Testing Statistics Query...');

    // 1. Get a business ID
    const { data: businesses, error: busError } = await supabase.from('businesses').select('id').limit(1);
    if (busError) {
        console.error('Error fetching businesses:', busError);
        return;
    }
    const businessId = businesses[0].id;
    console.log('Using Business ID:', businessId);

    // 2. Fetch paid items (service role)
    const { data: allPaid, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'paid');

    if (error) console.error('Error fetching items:', error);

    console.log(`Found ${allPaid?.length || 0} paid items (Service Role).`);

    if (allPaid?.length > 0) {
        const deletedCount = allPaid.filter(i => i.is_deleted).length;
        const activeCount = allPaid.filter(i => !i.is_deleted).length;
        console.log(`Deleted: ${deletedCount}, Active: ${activeCount}`);
        console.log('Sample deleted item:', allPaid.find(i => i.is_deleted));
    } else {
        console.log('No paid items found! Check if handleTakePayment is actually updating them.');
    }
}

testStats();
