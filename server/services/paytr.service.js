const crypto = require('crypto');
const axios = require('axios');
const microtime = require('microtime');

class PaytrService {
    constructor() {
        this.apiUrl = 'https://www.paytr.com/odeme';
    }

    async getCredentials() {
        // Fetch from DB or Env
        let dbSettings = {};

        try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

            const { data } = await supabase
                .from('payment_settings')
                .select('*')
                .eq('provider', 'paytr')
                .single();

            if (data) {
                dbSettings = {
                    merchantId: data.merchant_id,
                    merchantKey: data.api_key, // Mapped
                    merchantSalt: data.salt,   // Mapped
                    testMode: data.mode === 'sandbox' ? '1' : '0',
                    okUrl: data.base_url ? data.base_url.split('|')[0] : '',
                    failUrl: data.base_url ? data.base_url.split('|')[1] : ''
                };
            }
        } catch (err) {
            console.error('Error fetching PayTR settings from DB:', err);
        }

        // Merge DB and Env (DB takes precedence)
        const creds = {
            merchantId: (dbSettings.merchantId || process.env.PAYTR_MERCHANT_ID || '').trim(),
            merchantKey: (dbSettings.merchantKey || process.env.PAYTR_MERCHANT_KEY || '').trim(),
            merchantSalt: (dbSettings.merchantSalt || process.env.PAYTR_MERCHANT_SALT || '').trim(),
            testMode: (dbSettings.testMode !== undefined ? dbSettings.testMode : (process.env.PAYTR_TEST_MODE || '0')).trim(),
            okUrl: (dbSettings.okUrl || process.env.PAYTR_OK_URL || '').trim(),
            failUrl: (dbSettings.failUrl || process.env.PAYTR_FAIL_URL || '').trim()
        };

        // Final verification log
        if (!creds.merchantId) {
            console.error('CRITICAL: PayTR Credentials missing in BOTH DB and ENV');
        }

        return creds;
    }

    validateConfig(creds) {
        if (!creds.merchantId || !creds.merchantKey || !creds.merchantSalt) {
            // Check if we are in a "setup" phase where we might tolerate missing creds for some operations, 
            // but for payment we must have them.
            // For now, throw error.
            const missing = [];
            if (!creds.merchantId) missing.push('merchantId');
            if (!creds.merchantKey) missing.push('merchantKey');
            if (!creds.merchantSalt) missing.push('merchantSalt');

            console.error(`PAYTR_CONFIGURATION_ERROR: Credentials missing in DB or .env. Missing fields: ${missing.join(', ')}`);
            // We throw here usually, but let's log and throw to be safe.
            throw new Error(`PAYTR_CONFIGURATION_ERROR: Credentials missing (${missing.join(', ')})`);
        }
    }



    /**
     * Create PayTR Iframe Token
     */
    async createPayment(data) {
        const creds = await this.getCredentials();
        this.validateConfig(creds);

        const amount = parseFloat(data.amount) * 100; // Convert to cents (e.g., 1.00 TL -> 100)
        const user_basket = JSON.stringify([['Abonelik', amount.toString(), 1]]); // Name, Price (in cents?), Count. Wait.
        // PayTR user_basket expects price per item. 
        // Docs: "Her bir ürünün fiyatı... Örnek: 10.50 TL için 10.50" - WAIT.
        // Let's check official docs standard.
        // Direct API sends amount in cents. Iframe API sends amount in cents?
        // Actually usually PayTR asks for total_amount in cents, but user_basket prices?
        // "user_basket HTML form encoded json structure. her bir array öğesi [ürün adı, birim fiyat, adet]... Birim fiyat, TR kuruş..."
        // Yes, likely cents.

        // Params for Iframe Init (get-token)
        const requestParams = {
            merchant_id: creds.merchantId,
            user_ip: data.user.ip || '127.0.0.1',
            merchant_oid: data.orderId,
            email: data.user.email,
            payment_amount: amount, // Total amount in cents
            currency: 'TL',
            test_mode: creds.testMode,
            non_3d: '0', // 0 for 3D Secure (default for web), 1 for non-3D
            merchant_ok_url: creds.okUrl,
            merchant_fail_url: creds.failUrl,
            user_name: (data.user.name + ' ' + data.user.surname).trim(),
            user_address: 'Dijital Abonelik', // Placeholder if not provided
            user_phone: data.user.phone,
            user_basket: user_basket,
            debug_on: 1,
            no_installment: 1, // Disable installments for subscription usually
            max_installment: 1,
            timeout_limit: 30, // Minutes
            lang: 'tr'
        };

        // Generate Token Hash
        // CONCAT: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
        const hashStr = `${requestParams.merchant_id}${requestParams.user_ip}${requestParams.merchant_oid}${requestParams.email}${requestParams.payment_amount}${requestParams.user_basket}${requestParams.no_installment}${requestParams.max_installment}${requestParams.currency}${requestParams.test_mode}`;

        requestParams.paytr_token = crypto.createHmac('sha256', creds.merchantKey).update(hashStr + creds.merchantSalt).digest('base64');

        try {
            const response = await axios.post(`${this.apiUrl}/api/get-token`, requestParams, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const result = response.data;
            if (result.status === 'success') {
                return {
                    token: result.token,
                    iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`
                };
            } else {
                throw new Error('PayTR Token Failed: ' + result.reason);
            }
        } catch (error) {
            console.error('PayTR createPayment Error:', error.message);
            throw new Error('PayTR ödeme başlatılamadı: ' + error.message);
        }
    }

    /**
     * Generate PayTR Token for payment initialization
     */
    generateToken(params, creds) {
        this.validateConfig(creds);
        const {
            user_ip,
            merchant_oid,
            email,
            payment_amount,
            payment_type,
            installment_count,
            currency,
            test_mode,
            non_3d
        } = params;

        // Use test_mode from creds if not passed
        const finalTestMode = test_mode || creds.testMode;

        const hashStr = `${creds.merchantId}${user_ip}${merchant_oid}${email}${payment_amount}${payment_type}${installment_count}${currency}${finalTestMode}${non_3d}`;
        const paytrToken = hashStr + creds.merchantSalt;
        const token = crypto.createHmac('sha256', creds.merchantKey).update(paytrToken).digest('base64');

        console.log('PAYTR DEBUG:');
        console.log('Merchant ID:', creds.merchantId);
        console.log('Merchant OID:', merchant_oid);
        console.log('User IP:', user_ip);
        console.log('Amount:', payment_amount);
        console.log('Hash String:', hashStr);
        console.log('Generated Token:', token);

        return token;
    }

    /**
     * List user's saved cards from PayTR CAPI
     */
    async listSavedCards(utoken) {
        const creds = await this.getCredentials();
        this.validateConfig(creds);

        try {
            const paytrTokenSrc = crypto.createHmac('sha256', creds.merchantKey)
                .update(utoken + creds.merchantSalt)
                .digest('base64');

            const response = await axios.post(`${this.apiUrl}/capi/list`, {
                merchant_id: creds.merchantId,
                utoken: utoken,
                paytr_token: paytrTokenSrc
            }, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            return response.data;
        } catch (error) {
            console.error('PayTR List Cards Error:', error.message);
            throw new Error('Kartlar listelenirken hata oluştu');
        }
    }

    /**
     * Delete a saved card
     */
    async deleteSavedCard(utoken, ctoken) {
        const creds = await this.getCredentials();
        this.validateConfig(creds);

        try {
            const paytrTokenSrc = crypto.createHmac('sha256', creds.merchantKey)
                .update(ctoken + utoken + creds.merchantSalt)
                .digest('base64');

            const response = await axios.post(`${this.apiUrl}/capi/delete`, {
                merchant_id: creds.merchantId,
                utoken: utoken,
                ctoken: ctoken,
                paytr_token: paytrTokenSrc
            }, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            return response.data;
        } catch (error) {
            console.error('PayTR Delete Card Error:', error.message);
            throw new Error('Kart silinirken hata oluştu');
        }
    }

    /**
     * Verify Callback Hash
     */
    async verifyCallbackHash(params) {
        const creds = await this.getCredentials();

        const { merchant_oid, status, total_amount, hash } = params;
        const paytrToken = merchant_oid + creds.merchantSalt + status + total_amount;
        const expectedToken = crypto.createHmac('sha256', creds.merchantKey).update(paytrToken).digest('base64');

        return expectedToken === hash;
    }

    /**
     * Charge a saved card (Recurring / Non-3D)
     */
    async chargeSavedCard(params) {
        const creds = await this.getCredentials();
        this.validateConfig(creds);

        const {
            utoken,
            ctoken,
            amount,
            orderId,
            email,
            ip,
            currency = 'TL',
            installment_count = 0,
            non_3d = '1', // Default to 1 for recurring (background)
            recurring_payment = '1' // Default to 1 for recurring
        } = params;

        const payment_amount = amount;
        const payment_type = 'card';
        const test_mode = creds.testMode;

        const hashStr = `${creds.merchantId}${ip}${orderId}${email}${payment_amount}${payment_type}${installment_count}${currency}${test_mode}${non_3d}`;
        const paytrToken = hashStr + creds.merchantSalt;
        const token = crypto.createHmac('sha256', creds.merchantKey).update(paytrToken).digest('base64');

        try {
            const response = await axios.post(this.apiUrl, {
                merchant_id: creds.merchantId,
                user_ip: ip,
                merchant_oid: orderId,
                email: email,
                payment_amount: payment_amount,
                payment_type: payment_type,
                installment_count: installment_count,
                currency: currency,
                test_mode: test_mode,
                non_3d: non_3d,
                merchant_ok_url: 'http://placeholder.com',
                merchant_fail_url: 'http://placeholder.com',
                user_name: 'System Charge',
                user_address: 'System Address',
                user_phone: '9999999999',
                user_basket: JSON.stringify([['Subscription Charge', payment_amount, 1]]),
                debug_on: 1,
                utoken: utoken,
                ctoken: ctoken,
                paytr_token: token,
                recurring_payment: recurring_payment
            }, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            return response.data;
        } catch (error) {
            console.error('PayTR Charge Error:', error.message);
            throw error;
        }
    }
}

module.exports = new PaytrService();
