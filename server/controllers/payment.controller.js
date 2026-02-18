const PaymentManager = require('../services/payment/paymentManager');
const IyzicoService = require('../services/payment/iyzicoService');
const PaytrService = require('../services/paytr.service');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const iyzicoServiceV2 = require('../services/iyzicoService'); // The one I created

// 0. Initialize CheckoutForm (New V2)
exports.initializeCheckoutForm = async (req, res) => {
    // DEBUG: Start logging
    console.log('--- PAYMENT DEBUG INIT ---');
    console.log('PAYMENT_PROVIDER:', process.env.PAYMENT_PROVIDER);

    console.log('Incoming Request Body:', JSON.stringify(req.body, null, 2));

    try {
        const { amount, planId, period } = req.body;
        const businessId = req.body.businessId;

        if (!amount || !businessId || !planId) {
            return res.status(400).json({ status: 'failed', message: 'Amount, businessId and planId are required' });
        }

        // Generate a simple, safe Conversation ID for Iyzico (to avoid length/char issues)
        // We will store the actual details in our DB and look them up later
        const simpleId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log('Generated Simple ID:', simpleId);

        const request = {
            locale: 'tr',
            conversationId: simpleId,
            price: amount.toString(),
            paidPrice: amount.toString(),
            currency: 'TRY',
            basketId: simpleId, // Use same ID for basket to be safe
            paymentGroup: 'PRODUCT',
            callbackUrl: `${process.env.VITE_API_URL || 'http://localhost:5000'}/api/payment/callback/iyzico`,
            buyer: {
                id: businessId,
                name: 'Siento',
                surname: 'User',
                gsmNumber: '+905555555555',
                email: 'test@sientopos.com',
                identityNumber: '11111111111',
                registrationAddress: 'Nidakule Göztepe',
                ip: req.ip || '127.0.0.1',
                city: 'Istanbul',
                country: 'Turkey',
                zipCode: '34732'
            },
            shippingAddress: {
                contactName: 'Siento User',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Nidakule Göztepe',
                zipCode: '34732'
            },
            billingAddress: {
                contactName: 'Siento User',
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Nidakule Göztepe',
                zipCode: '34732'
            },
            basketItems: [
                {
                    id: planId,
                    name: 'Siento POS Abonelik',
                    category1: 'SaaS',
                    itemType: 'VIRTUAL',
                    price: amount.toString()
                }
            ]
        };

        // Insert 'pending' transaction FIRST to ensure we have record
        const { error: txError } = await supabase.from('payment_transactions').insert({
            business_id: businessId,
            amount: amount,
            currency: 'TRY',
            status: 'pending',
            merchant_oid: simpleId, // This is our key for lookup
            metadata: {
                plan_id: planId,
                period: period || 'monthly',
                type: 'subscription_initial'
            },
            created_at: new Date().toISOString()
        });

        if (txError) {
            console.error('Transaction Create Error:', txError);
            return res.status(500).json({ status: 'failed', message: 'İşlem kaydı oluşturulamadı' });
        }

        const result = await iyzicoServiceV2.checkoutFormInitialize(request);

        // DEBUG: Log result
        console.log('Iyzico Response Status:', result.status);
        if (result.status !== 'success') {
            console.log('Iyzico Error Message:', result.errorMessage);
            console.log('Iyzico Full Response:', JSON.stringify(result, null, 2));
        }

        if (result.status === 'success') {
            res.json({
                status: 'success',
                checkoutFormContent: result.checkoutFormContent,
                token: result.token
            });
        } else {
            // Return real errorMessage in response
            res.status(400).json({
                status: 'failed',
                message: result.errorMessage || 'Iyzico başlatılamadı',
                detail: result
            });
        }
    } catch (error) {
        console.error('CRITICAL CATCH ERROR:', error.message);
        console.error('Stack:', error.stack);
        // Pass the error message to frontend
        res.status(400).json({ status: 'failed', message: error.message });
    } finally {
        console.log('--- PAYMENT DEBUG END ---');
    }
};

// 1. Initialize Payment
exports.createPayment = async (req, res) => {
    try {
        const { user, orderId, amount, planId, period } = req.body;
        // user: { id, email, name, surname, phone, ... }
        // amount: 100.00

        console.log('Payment Request:', { orderId, amount, provider: 'AUTO' });

        const paymentData = {
            orderId,
            amount,
            planId,
            period,
            user: {
                id: user?.id,
                email: user?.email,
                name: user?.name,
                surname: user?.surname,
                phone: user?.phone,
                ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').replace('::1', '127.0.0.1')
            },
            card: req.body.card // { holderName, number, expireMonth, expireYear, cvc } - Only for Iyzico Non-3DS or Custom Form
        };

        const result = await PaymentManager.createPayment(paymentData);

        res.json(result);

    } catch (error) {
        console.error('Create Payment Error:', error);
        console.error('Error Details:', error.response?.data || error.message);
        // Pass the exact error reason to frontend if available
        const errorMessage = error.message || 'Ödeme oluşturulamadı';
        res.status(500).json({ status: 'failed', reason: errorMessage });
    }
};

// 2. Handle Iyzico Callback
exports.handleIyzicoCallback = async (req, res) => {
    try {
        const logData = `\n\n--- CALLBACK ${new Date().toISOString()} ---\n` +
            `Headers: ${JSON.stringify(req.headers)}\n` +
            `Body: ${JSON.stringify(req.body)}\n`;
        fs.appendFileSync('iyzico_debug.log', logData);
    } catch (e) { }

    console.log('--- IYZICO CALLBACK DEBUG START ---');
    console.log('Callback Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Callback Body:', JSON.stringify(req.body, null, 2));

    try {
        const { token } = req.body;
        if (!token) {
            console.error('No token in Iyzico callback');
            return res.redirect(`http://localhost:5173/isletme/siento-faturalari?status=fail&reason=no_token`);
        }

        const result = await iyzicoServiceV2.retrieveCheckoutFormResult({
            locale: 'tr',
            token: token
        });

        try {
            fs.appendFileSync('iyzico_debug.log', `Result: ${JSON.stringify(result, null, 2)}\n`);
        } catch (e) { }

        console.log('Iyzico retrieve result:', JSON.stringify(result, null, 2));
        const clientUrl = 'http://localhost:5173'; // Hardcoded safe fallback

        if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {

            // Strategy: Use conversationId OR basketId to look up the transaction in DB
            const lookupId = result.conversationId || result.basketId;

            console.log('Looking up transaction for ID:', lookupId);

            const { data: transaction, error: txFetchError } = await supabase
                .from('payment_transactions')
                .select('*')
                .eq('merchant_oid', lookupId)
                .single();

            if (txFetchError || !transaction) {
                console.error('Transaction Not Found for ID:', lookupId);
                // Try fallback to use other ID if one is missing, but usually they are same now
                throw new Error(`Transaction Record Not Found: ${lookupId}`);
            }

            const businessId = transaction.business_id;
            const planId = transaction.metadata.plan_id;
            const period = transaction.metadata.period;

            console.log('Transaction Found:', { businessId, planId, period });

            // 1. Fetch current business data to handle extension
            const { data: business, error: busFetchError } = await supabase
                .from('businesses')
                .select('subscription_end_date, status, reseller_id')
                .eq('id', businessId)
                .single();

            if (busFetchError) {
                console.error('Business fetch error:', busFetchError);
                throw new Error(`Business not found: ${businessId}`);
            }

            let baseDate = new Date();
            // If current subscription is active and in the future, extend from that date
            if (business?.subscription_end_date && new Date(business.subscription_end_date) > new Date()) {
                baseDate = new Date(business.subscription_end_date);
            }

            // 1.5 Fetch Plan details (Campaign Check)
            const { data: planData } = await supabase
                .from('subscription_plans')
                .select('yearly_campaign_active')
                .eq('id', planId)
                .single();

            const endDate = new Date(baseDate);
            if (period === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            } else {
                // Yearly
                if (planData?.yearly_campaign_active) {
                    console.log('CAMPAIGN APPLIED: Adding 15 months (12+3)');
                    endDate.setMonth(endDate.getMonth() + 15);
                } else {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                }
            }

            console.log('Calculating dates:', { baseDate: baseDate.toISOString(), endDate: endDate.toISOString() });

            // 2. Update Business Table (status, plan, end_date)
            const { error: busUpdateError } = await supabase
                .from('businesses')
                .update({
                    status: 'active',
                    subscription_plan: period,
                    subscription_end_date: endDate.toISOString()
                })
                .eq('id', businessId);

            if (busUpdateError) console.error('Business update error:', busUpdateError);

            // 3. Upsert Subscriptions Table
            const { error: subUpsertError } = await supabase
                .from('subscriptions')
                .upsert({
                    business_id: businessId,
                    plan_type: period,
                    plan_id: planId,
                    start_date: new Date().toISOString(),
                    end_date: endDate.toISOString(),
                    status: 'active',
                    last_payment_date: new Date().toISOString(),
                    retry_count: 0
                }, { onConflict: 'business_id' });

            if (subUpsertError) console.error('Subscription upsert error:', subUpsertError);

            // Log transaction
            const { error: txError } = await supabase.from('payment_transactions').insert({
                merchant_oid: result.paymentId,
                business_id: businessId,
                amount: parseFloat(result.paidPrice),
                status: 'success',
                metadata: { token, planId, period, provider: 'iyzico_v2' }
            });

            if (txError) console.error('Transaction log error:', txError);

            // 4. Handle Reseller Commission
            if (business?.reseller_id) {
                try {
                    const { data: reseller } = await supabase
                        .from('resellers')
                        .select('commission_rate')
                        .eq('id', business.reseller_id)
                        .single();

                    const rate = reseller?.commission_rate || 15.00;
                    const paidPrice = parseFloat(result.paidPrice);
                    const commissionAmount = (paidPrice * rate) / 100;

                    console.log(`Calculating Commission: Reseller=${business.reseller_id}, Rate=${rate}%, Amount=${commissionAmount}`);

                    const { error: commError } = await supabase.from('reseller_commissions').insert({
                        reseller_id: business.reseller_id,
                        business_id: businessId,
                        base_amount: paidPrice,
                        commission_rate: rate,
                        commission_amount: commissionAmount,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    });

                    if (commError) console.error('Commission Insert Error:', commError);
                    else console.log('Commission recorded successfully.');

                } catch (rErr) {
                    console.error('Reseller Commission Logic Error:', rErr);
                }
            }

            return res.redirect(`${clientUrl}/isletme/siento-faturalari?status=success`);
        } else {
            console.error('Iyzico Payment Failed:', result);
            return res.redirect(`${clientUrl}/isletme/siento-faturalari?status=fail&reason=${result.errorMessage || 'Ödeme tamamlanamadı'}`);
        }

    } catch (error) {
        console.error('CRITICAL CATCH ERROR in handleIyzicoCallback:', error.message);
        console.error('Stack:', error.stack);
        const clientUrl = 'http://localhost:5173';
        res.redirect(`${clientUrl}/isletme/siento-faturalari?status=error&msg=${encodeURIComponent(error.message)}`);
    }
};

exports.handleCallback = async (req, res) => {
    try {
        const callbackParams = req.body;

        // 1. Verify Hash (Await it!)
        const isValid = await PaytrService.verifyCallbackHash(callbackParams);
        if (!isValid) {
            console.error('PayTR Callback Hash Mismatch');
            return res.status(400).send('BAD HASH');
        }

        const { status, merchant_oid, utoken } = callbackParams;

        if (status === 'success') {
            const { data: transaction } = await supabase
                .from('payment_transactions')
                .select('business_id, metadata')
                .eq('merchant_oid', merchant_oid)
                .single();

            if (transaction && transaction.business_id) {
                const businessId = transaction.business_id;

                if (utoken) {
                    await supabase
                        .from('businesses')
                        .update({ paytr_utoken: utoken })
                        .eq('id', businessId);
                }

                if (utoken && callbackParams.ctoken) {
                    const { error: cardError } = await supabase
                        .from('business_cards')
                        .upsert({
                            business_id: businessId,
                            paytr_card_token: callbackParams.ctoken,
                            last4: callbackParams.last_4 || '****',
                            brand: callbackParams.card_brand || 'Unknown',
                            created_at: new Date().toISOString()
                        }, { onConflict: 'business_id, paytr_card_token' });

                    if (cardError) console.error('Error saving business card:', cardError);
                }

                await supabase
                    .from('payment_transactions')
                    .update({ status: 'success' })
                    .eq('merchant_oid', merchant_oid);

                const meta = transaction.metadata || {};

                if (meta.type === 'subscription_initial') {
                    console.log(`Activating subscription for Business ${businessId} (Plan: ${meta.plan_id})`);

                    const startDate = new Date();
                    const endDate = new Date();
                    if (meta.period === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
                    else endDate.setFullYear(endDate.getFullYear() + 1);

                    const { error: subError } = await supabase
                        .from('subscriptions')
                        .upsert({
                            business_id: businessId,
                            plan_type: meta.period,
                            plan_id: meta.plan_id,
                            start_date: startDate.toISOString(),
                            end_date: endDate.toISOString(),
                            status: 'active',
                            last_payment_date: new Date().toISOString(),
                            retry_count: 0
                        });

                    if (subError) console.error('Subscription Activation Failed:', subError);
                }

                console.log(`Payment Success processed for Business ${businessId}`);
            } else {
                console.error(`Transaction not found for OID: ${merchant_oid}`);
            }
        } else {
            console.log(`Payment Failed for Order ${merchant_oid}: ${callbackParams.failed_reason_msg}`);
        }

        res.send('OK');

    } catch (error) {
        console.error('Callback Error:', error);
        res.status(500).send('ERROR');
    }
};

exports.storeCardInit = async (req, res) => {
    return exports.createPayment(req, res);
};

exports.getConfigStatus = async (req, res) => {
    try {
        const creds = await PaytrService.getCredentials();
        res.json({
            merchant_id: creds.merchantId,
            merchant_key: creds.merchantKey ? '******' : '',
            merchant_salt: creds.merchantSalt ? '******' : '',
            test_mode: creds.testMode,
            ok_url: creds.okUrl,
            fail_url: creds.failUrl,
            is_env: !creds.merchantId
        });
    } catch (error) {
        res.status(500).json({ error: 'Ayarlar getirilemedi' });
    }
};

// ADMIN: Get All Settings
exports.getAllConfigStatus = async (req, res) => {
    try {
        const { data: providers } = await supabase.from('payment_providers').select('*');
        const { data: settings } = await supabase.from('payment_settings').select('*');

        const activeProvider = providers.find(p => p.is_active)?.name || 'iyzico';

        const settingsMap = {
            iyzico: {
                api_key: '',
                secret_key: '',
                mode: 'sandbox'
            },
            paytr: {
                merchant_id: '',
                merchant_key: '',
                merchant_salt: '',
                mode: 'sandbox',
                ok_url: '',
                fail_url: ''
            }
        };

        if (settings) {
            settings.forEach(s => {
                if (s.provider === 'iyzico') {
                    settingsMap.iyzico = {
                        api_key: s.api_key || '',
                        secret_key: s.secret_key || '',
                        mode: s.mode
                    };
                } else if (s.provider === 'paytr') {
                    settingsMap.paytr = {
                        merchant_id: s.merchant_id,
                        merchant_key: s.api_key || '',
                        merchant_salt: s.salt || '',
                        mode: s.mode,
                        ok_url: s.base_url?.split('|')[0] || '',
                        fail_url: s.base_url?.split('|')[1] || ''
                    };
                }
            });
        }

        res.json({
            active: activeProvider,
            settings: settingsMap
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ayarlar alınamadı' });
    }
};

// ADMIN: Update Config
exports.updateConfig = async (req, res) => {
    try {
        const { provider, settings } = req.body;
        // settings: { api_key, ... }

        const upsertData = {
            provider,
            mode: settings.mode
        };

        if (provider === 'iyzico') {
            if (settings.api_key && !settings.api_key.includes('*')) upsertData.api_key = settings.api_key;
            if (settings.secret_key && !settings.secret_key.includes('*')) upsertData.secret_key = settings.secret_key;
        }
        else if (provider === 'paytr') {
            upsertData.merchant_id = settings.merchant_id;
            if (settings.merchant_key && !settings.merchant_key.includes('*')) upsertData.api_key = settings.merchant_key; // Mapping
            if (settings.merchant_salt && !settings.merchant_salt.includes('*')) upsertData.salt = settings.merchant_salt;
            // Store URLs in base_url separated by pipe
            upsertData.base_url = `${settings.ok_url}|${settings.fail_url}`;
        }

        // Remove undefined keys
        Object.keys(upsertData).forEach(key => upsertData[key] === undefined && delete upsertData[key]);

        const { error } = await supabase
            .from('payment_settings')
            .upsert(upsertData, { onConflict: 'provider' });

        if (error) throw error;

        res.json({ success: true, message: 'Ayarlar güncellendi' });
    } catch (error) {
        console.error('Config Update Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ADMIN: Set Active Provider
exports.setActiveProvider = async (req, res) => {
    try {
        const { provider } = req.body; // 'iyzico' or 'paytr'

        // Transaction manually:
        // 1. Set all to false
        await supabase.from('payment_providers').update({ is_active: false }).neq('id', 0);

        // 2. Set target to true
        const { error } = await supabase
            .from('payment_providers')
            .update({ is_active: true })
            .eq('name', provider);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
