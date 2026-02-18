import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
    } else {
        console.log('Sample row keys:', data && data.length > 0 ? Object.keys(data[0]) : 'No data found, cannot infer schema');
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
            console.log('Has sort_order:', 'sort_order' in data[0]);
        } else {
            console.log('No data found in products table.');
        }
    }
}


checkSchema();
