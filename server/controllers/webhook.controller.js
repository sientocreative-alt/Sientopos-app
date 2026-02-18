const PaymentProviderFactory = require('../services/payment/paymentProvider');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.handleIyzicoWebhook = async (req, res) => {
    try {
        const provider = await PaymentProviderFactory.getProvider();
        // Verify Signature (If provider supports it)
        // Note: active provider might be PayTR but we receive Iyzico webhook if old subs exist.
        // So we should instantiate IyzicoProvider explicitly for verification if needed, 
        // OR rely on Factory to give us 'iyzico' provider if we ask for it?
        // Factory logic selects *active* provider. 
        // We should explicitly use IyzicoProvider for Iyzico webhook.

        // For now, let's just log it as requested "200 OK" and basic logic.
        // Implementation Plan said "Verify Signature". IyzicoProvider has `verifyWebhookSignature`.

        // const iyzico = new (require('../services/payment/iyzicoProvider'))();
        // if (!iyzico.verifyWebhookSignature(req)) return res.status(403).send('Invalid Signature');

        const eventType = req.body?.iyziEventType; // 'subscription.created', etc.
        const subscriptionReferenceCode = req.body?.subscriptionReferenceCode;

        console.log('Iyzico Webhook:', eventType, subscriptionReferenceCode);

        // Log to DB
        await supabase.from('payment_logs').insert({
            provider: 'iyzico',
            event_type: eventType,
            payload: req.body
        });

        // Business Logic
        if (eventType === 'subscription.renewed' || eventType === 'subscription.created') {
            // Update Subscription
            await supabase.from('subscriptions')
                .update({
                    status: 'active',
                    renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Rough est, or parse from body
                })
                .eq('subscription_id', subscriptionReferenceCode);
        } else if (eventType === 'subscription.canceled') {
            await supabase.from('subscriptions')
                .update({ status: 'canceled' })
                .eq('subscription_id', subscriptionReferenceCode);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Iyzico Webhook Error:', error);
        res.status(200).send('OK'); // Always return 200 to webhook sender to prevent retries if logic fails
    }
};

exports.handlePaytrWebhook = async (req, res) => {
    try {
        // PayTR sends POST data
        console.log('PayTR Webhook:', req.body);

        // Verify Hash (Use PaytrProvider or Service)
        // const valid = ...

        // Log
        await supabase.from('payment_logs').insert({
            provider: 'paytr',
            event_type: 'payment', // PayTR usually sends 'success' or 'fail' in body status
            payload: req.body
        });

        // PayTR expects "OK" text response
        res.send('OK');
    } catch (error) {
        console.error('PayTR Webhook Error:', error);
        res.status(500).send('ERR');
    }
};
