import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bchfjhoziaxjglgnekqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaGZqaG96aWF4amdsZ25la3FjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgwNDk1MiwiZXhwIjoyMDg1MzgwOTUyfQ.zpOlG7RfdgJ0nYxdTJ87nzktlJN9STGdgdmqgiz2H1o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching tables:', JSON.stringify(error));
    } else {
        if (data && data.length > 0) {
            console.log('KEYS:', JSON.stringify(Object.keys(data[0])));
            console.log('ROW:', JSON.stringify(data[0]));
        } else {
            console.log('No data found in tables table.');
        }
    }
}

inspectTable();
