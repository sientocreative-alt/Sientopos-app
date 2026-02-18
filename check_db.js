import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Read .env manually because it's in client folder
const envFile = fs.readFileSync('./client/.env', 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => line.split('=').map(s => s.trim()))
);

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://ndihvevkyisaxdfkltas.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('SUPABASE KEY NOT FOUND IN .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    console.log('Checking settings...');

    // Check pos_settings
    const { data: posSettings, error: posError } = await supabase
        .from('pos_settings')
        .select('*')
        .limit(1);

    if (posError) console.error('PosSettings error:', posError);
    else console.log('PosSettings system_flags:', JSON.stringify(posSettings[0]?.system_flags, null, 2));

    // Check qr_menus
    const { data: qrMenus, error: qrError } = await supabase
        .from('qr_menus')
        .select('id, name, allow_waiter_call')
        .limit(5);

    if (qrError) console.error('QrMenus error:', qrError);
    else console.log('QrMenus allow_waiter_call:', JSON.stringify(qrMenus, null, 2));
}

checkSettings();
