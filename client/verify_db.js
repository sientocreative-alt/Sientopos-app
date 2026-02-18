
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bchfjhoziaxjglgnekqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaGZqaG96aWF4amdsZ25la3FjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgwNDk1MiwiZXhwIjoyMDg1MzgwOTUyfQ.zpOlG7RfdgJ0nYxdTJ87nzktlJN9STGdgdmqgiz2H1o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
    console.log('Testing join between cash_closures and profiles...');
    const { data, error } = await supabase
        .from('cash_closures')
        .select(`
            *,
            profiles:created_by (full_name)
        `)
        .limit(1);

    if (error) {
        console.error('Join Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Join Success!');
        console.log('Record with profile:', JSON.stringify(data[0], null, 2));
    }
}

testJoin();
