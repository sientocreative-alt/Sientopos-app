require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const result = {
        scan_time: new Date().toISOString(),
        business: null,
        transactions: [],
        commissions: [],
        plans: []
    };

    // 1. Get latest business
    const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

    if (businesses && businesses.length > 0) {
        result.business = businesses[0];
    }

    // 2. Get latest transactions
    const { data: txs } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (txs) result.transactions = txs;

    // 3. Get latest commissions
    const { data: comms } = await supabase
        .from('reseller_commissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (comms) result.commissions = comms;

    // 4. Get plans
    const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*');

    if (plans) result.plans = plans;

    fs.writeFileSync('db_result.json', JSON.stringify(result, null, 2));
    console.log('Written to db_result.json');
}

check();
