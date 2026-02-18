const PaytrServiceOriginal = require('../paytr.service');

// Wrapper to adapt PaytrService to the common interface needed by PaymentManager
const PaytrServiceWrapper = {
    // PayTR typically uses Iframe/Redirect for initial payments, so 'createPayment' 
    // here usually means getting the token and iframe URL.
    async createPayment(data) {
        // Data should contain: { amount, orderId, user: { email, ip, ... }, ... }

        const creds = await PaytrServiceOriginal.getCredentials();

        const tokenParams = {
            user_ip: data.ip || '127.0.0.1',
            merchant_oid: data.orderId,
            email: data.user.email,
            payment_amount: data.amount,
            payment_type: 'card',
            installment_count: 0,
            currency: 'TL',
            test_mode: creds.testMode,
            non_3d: '0',
            user_name: data.user.name || 'Misafir',
            user_address: 'Dijital Hizmet',
            user_phone: data.user.phone || '905555555555',
            merchant_ok_url: `${process.env.VITE_CLIENT_URL}/payment/success`,
            merchant_fail_url: `${process.env.VITE_CLIENT_URL}/payment/fail`,
            user_basket: JSON.stringify([['Abonelik', data.amount.toString(), 1]]),
            debug_on: 1,
            timeout_limit: 30
        };

        const token = await PaytrServiceOriginal.generateToken(tokenParams, creds);

        return {
            status: 'success',
            provider: 'paytr',
            method: 'iframe',
            token: token,
            iframeUrl: 'https://www.paytr.com/odeme',
            htmlContent: null // Iyzico uses HTML content, PayTR uses iframe URL + Token
        };
    },

    // Pass-through for existing methods if needed
    getCredentials: PaytrServiceOriginal.getCredentials,
    chargeSavedCard: PaytrServiceOriginal.chargeSavedCard
};

module.exports = PaytrServiceWrapper;
