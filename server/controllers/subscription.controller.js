const PaymentProviderFactory = require('../services/payment/paymentProvider');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper: Ensure Iyzico Product exists
async function ensureIyzicoProduct(providerName, provider) {
    if (providerName !== 'iyzico') return null;

    // Check DB for global product code
    // Ideally we store this in system_settings or a singleton
    // For now, let's look for a known code or create one
    // We can check first plan's product_code
    const { data: plans } = await supabase.from('subscription_plans').select('external_product_id').limit(1);

    if (plans && plans.length > 0 && plans[0].external_product_id) {
        return plans[0].external_product_id;
    }

    // Create New Product
    try {
        const product = await provider.createProduct({
            name: 'Siento POS Abonelik',
            description: 'Siento POS Hizmet Paketi'
        });

        // Update all plans to use this (or store it somewhere)
        // Let's assume we return it and caller usage handles usage.
        return product.referenceCode;
    } catch (e) {
        console.error('Ensure Product Error:', e.message);
        throw e;
    }
}

exports.createPlan = async (req, res) => {
    try {
        const provider = await PaymentProviderFactory.getProvider();
        const { name, price, interval } = req.body; // interval: 'monthly' | 'yearly'

        // 1. Ensure Product (Iyzico specific)
        const productCode = await ensureIyzicoProduct('iyzico', provider); // Hardcoded 'iyzico' check is a bit leaky abstraction but necessary for init.

        // 2. Create Plan
        const planRef = await provider.createPlan({
            productCode, // Iyzico needs this
            name,
            price,
            interval
        });

        // 3. Save to DB (Update existing plan or create new?)
        // Usually called when Admin creates a plan in our DB.

        res.json({ status: 'success', referenceCode: planRef.referenceCode });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.startSubscription = async (req, res) => {
    try {
        let { businessId, planId, period, user } = req.body;
        // user: { name, surname, email, phone, ... }

        // If user is not provided (e.g. called from legacy frontend), fetch from business
        if (!user) {
            const { data: business } = await supabase
                .from('businesses')
                .select('pos_settings(full_name, contact_email, contact_phone)') // Adjust fields as per schema
                .eq('id', businessId)
                .single();

            if (business && business.pos_settings && business.pos_settings.length > 0) {
                const settings = business.pos_settings[0];
                const nameParts = (settings.full_name || 'Business User').split(' ');
                user = {
                    name: nameParts[0],
                    surname: nameParts.slice(1).join(' ') || 'User',
                    email: settings.contact_email || 'info@sientopos.com',
                    phone: settings.contact_phone || '+905555555555'
                };
            } else {
                user = {
                    name: 'Business',
                    surname: 'User',
                    email: 'info@sientopos.com',
                    phone: '+905555555555'
                };
            }
        }

        const provider = await PaymentProviderFactory.getProvider();
        const { data: activeProviderSettings } = await supabase.from('payment_settings').select('provider').eq('is_active', true).maybeSingle();
        const providerName = activeProviderSettings?.provider || 'iyzico';

        // 1. Get Plan Details
        const { data: plan } = await supabase.from('subscription_plans').select('*').eq('id', planId).single();
        if (!plan) throw new Error('Plan not found');

        const amount = period === 'monthly' ? plan.monthly_price : plan.yearly_price;

        // 2. Get/Create Customer
        let customerRef = null;

        // Check if business has customer ref for this provider
        const { data: customerRecord } = await supabase
            .from('payment_customers')
            .select('*')
            .eq('business_id', businessId)
            .eq('provider', providerName)
            .maybeSingle();

        if (customerRecord) {
            customerRef = customerRecord.provider_customer_id;
        } else {
            // Create Customer
            const newCust = await provider.createCustomer(user);
            customerRef = newCust.referenceCode; // Iyzico returns referenceCode

            // Save
            await supabase.from('payment_customers').insert({
                business_id: businessId,
                provider: providerName,
                provider_customer_id: customerRef,
                email: user.email
            });
        }

        // 3. Determine Plan Reference Code (Iyzico)
        let planRefCode = null;
        if (providerName === 'iyzico') {
            planRefCode = period === 'monthly' ? plan.external_plan_id_monthly : plan.external_plan_id_yearly;

            // If missing, try to create it on the fly? (Auto-sync)
            if (!planRefCode) {
                const productCode = await ensureIyzicoProduct('iyzico', provider);
                const newRef = await provider.createPlan({
                    productCode,
                    name: `${plan.name} (${period})`,
                    price: amount,
                    interval: period
                });
                planRefCode = newRef.referenceCode;

                // Update DB
                const field = period === 'monthly' ? 'external_plan_id_monthly' : 'external_plan_id_yearly';
                // Update generic field? SQL migration added external_plan_id_monthly
                await supabase.from('subscription_plans').update({ [field]: planRefCode, external_product_id: productCode }).eq('id', plan.id);
            }
        }

        // 4. Start Subscription
        const result = await provider.startSubscription({
            customerReferenceCode: customerRef,
            pricingPlanReferenceCode: planRefCode,
            callbackUrl: `${process.env.VITE_API_URL}/api/payment/callback/subscription`, // Generic callback
            // PayTR props
            amount,
            orderId: `SUB-${businessId}-${Date.now()}`,
            user
        });

        res.json({
            status: 'success',
            data: result // Contains pageUrl or token
        });

    } catch (error) {
        console.error('Start Subscription Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        // Verify ownership via businessId etc.

        const provider = await PaymentProviderFactory.getProvider();
        await provider.cancelSubscription(subscriptionId);

        // Update DB
        await supabase.from('subscriptions').update({ status: 'canceled' }).eq('subscription_id', subscriptionId);

        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const { id } = req.params; // External ID
        const provider = await PaymentProviderFactory.getProvider();
        const status = await provider.getSubscriptionStatus(id);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSubscription = async (req, res) => {
    try {
        const { businessId } = req.params;
        // Use maybeSingle to return null instead of error if not found
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('business_id', businessId)
            .maybeSingle();

        if (error) throw error;

        res.json({ status: 'success', subscription: data });
    } catch (error) {
        console.error('Get Subscription Error:', error);
        res.status(500).json({ error: 'Abonelik bilgisi alınamadı' });
    }
};
