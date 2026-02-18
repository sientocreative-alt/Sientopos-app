const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const PaytrService = require('../services/paytr.service');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PLAN_PRICES = {
    'monthly': 100.00,
    'yearly': 1000.00
};

const checkRecurringPayments = async () => {
    console.log('Running daily recurring payment check...');

    // 1. Fetch active subscriptions expiring today or past due
    const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
            *,
            businesses (
                paytr_utoken,
                pos_settings (contact_email)
            ),
            business_cards!inner (
                paytr_card_token
            )
        `)
        .eq('status', 'active')
        .lte('end_date', new Date().toISOString());

    if (error) {
        console.error('Recurring Job Error (Fetch):', error);
        return;
    }

    if (!subscriptions || subscriptions.length === 0) {
        console.log('No subscriptions due for payment.');
        return;
    }

    console.log(`Found ${subscriptions.length} subscriptions due.`);

    for (const sub of subscriptions) {
        try {
            const business = sub.businesses;
            // Assuming we take the first card for now. Logic could be improved to select 'default'
            const card = Array.isArray(sub.business_cards) ? sub.business_cards[0] : sub.business_cards;

            if (!card || !business.paytr_utoken) {
                console.error(`Missing card or utoken for sub ${sub.id}`);
                continue; // Skip
            }

            const amount = PLAN_PRICES[sub.plan_type];
            const orderId = 'REC-' + sub.business_id.split('-')[0] + '-' + Date.now();

            console.log(`Attempting charge for ${sub.business_id} - Amount: ${amount}`);

            // 2. Charge
            const result = await PaytrService.chargeSavedCard({
                utoken: business.paytr_utoken,
                ctoken: card.paytr_card_token,
                amount: amount,
                orderId: orderId,
                email: (Array.isArray(business.pos_settings) ? business.pos_settings[0]?.contact_email : business.pos_settings?.contact_email) || 'info@sientopos.com',
                ip: '127.0.0.1',
                installment_count: 0,
                non_3d: '1',
                recurring_payment: '1'
            });

            if (result.status === 'success') {
                console.log(`Charge Success for ${sub.id}`);

                // 3. Extend Subscription
                // Calculate new end date based on PREVIOUS end date to ensure no time is lost
                const previousEndDate = new Date(sub.end_date);
                const newEndDate = new Date(previousEndDate);

                if (sub.plan_type === 'monthly') {
                    // Add 1 Month
                    const currentDay = previousEndDate.getDate();
                    newEndDate.setMonth(newEndDate.getMonth() + 1);

                    // Handle overflow (Jan 31 -> Feb 28)
                    if (newEndDate.getDate() !== currentDay) {
                        newEndDate.setDate(0);
                    }
                } else {
                    // Add 1 Year
                    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                }

                // If for some reason the new end date is in the past (e.g. multiple missed payments?), 
                // we might want to reset to NOW, but for strict recurring, extending from previous end date is correct for billing cycles.

                await supabase
                    .from('subscriptions')
                    .update({
                        end_date: newEndDate.toISOString(),
                        last_payment_date: new Date().toISOString(),
                        retry_count: 0,
                        status: 'active'
                    })
                    .eq('id', sub.id);

                // Log
                await supabase.from('payment_transactions').insert({
                    merchant_oid: orderId,
                    business_id: sub.business_id,
                    amount: amount,
                    status: 'success',
                    metadata: { plan: sub.plan_type, type: 'recurring_auto' }
                });

            } else {
                console.error(`Charge Failed for ${sub.id}: ${result.msg}`);

                // 4. Handle Failure
                const newRetryCount = (sub.retry_count || 0) + 1;
                let newStatus = 'payment_failed';

                if (newRetryCount >= 3) {
                    newStatus = 'suspended';
                }

                await supabase
                    .from('subscriptions')
                    .update({
                        retry_count: newRetryCount,
                        status: newStatus
                    })
                    .eq('id', sub.id);

                // Log
                await supabase.from('payment_transactions').insert({
                    merchant_oid: orderId,
                    business_id: sub.business_id,
                    amount: amount,
                    status: 'failed',
                    metadata: { plan: sub.plan_type, error: result.msg, retry: newRetryCount }
                });
            }

        } catch (err) {
            console.error(`Processing error for sub ${sub.id}:`, err);
        }
    }
};

// Schedule: Daily at 03:00 AM
const initRecurringJob = () => {
    cron.schedule('0 3 * * *', checkRecurringPayments);
    console.log('Recurring Payment Job initialized (Daily 03:00)');
};

module.exports = { initRecurringJob, checkRecurringPayments };
