
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, 'server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStats() {
    console.log('Testing Statistics Query...');

    // 1. Get a business ID (assuming first one)
    const { data: businesses } = await supabase.from('businesses').select('id').limit(1);
    const businessId = businesses[0].id;
    console.log('Using Business ID:', businessId);

    // 2. Fetch paid items (service role)
    const { data: allPaid, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'paid');

    if (error) console.error(error);
    console.log(`Found ${allPaid?.length} paid items (Service Role).`);
    if (allPaid?.length > 0) {
        console.log('Sample item:', allPaid[0]);
        console.log('is_deleted status:', allPaid[0].is_deleted);
    }

    // 3. Simulate Client Query (using is_deleted filter if applicable)
    // Client query: .eq('status', 'paid').gte('created_at', startOfMonth)
    // We want to see if they are returned.

    // Note: We can't easily simulate Anon Role RLS here without a user token, 
    // but knowing if the data EXISTS allows us to narrow down if it's RLS or Data Missing.
}

testStats();
