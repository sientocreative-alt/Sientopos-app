const Iyzipay = require('iyzipay');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const getIyzipayInstance = async () => {
    // 1. Try DB first
    const { data } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('provider', 'iyzico')
        .single();

    const apiKey = (data?.api_key && data.api_key.trim() !== '') ? data.api_key : process.env.IYZICO_API_KEY;
    const secretKey = (data?.secret_key && data.secret_key.trim() !== '') ? data.secret_key : process.env.IYZICO_SECRET_KEY;
    const mode = data?.mode || 'sandbox';
    const baseUrl = mode === 'live' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com';

    if (!apiKey || !secretKey || apiKey === 'missing' || secretKey === 'missing') {
        throw new Error('Iyzico API anahtarları yapılandırılmamış. Lütfen Yönetim Panelinden Ayarlar > Ödeme Ayarları bölümüne gidin.');
    }

    return new Iyzipay({
        apiKey: apiKey,
        secretKey: secretKey,
        uri: baseUrl
    });
};

const checkoutFormInitialize = async (request) => {
    const iyzipay = await getIyzipayInstance();
    return new Promise((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(request, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

const retrieveCheckoutFormResult = async (request) => {
    const iyzipay = await getIyzipayInstance();
    return new Promise((resolve, reject) => {
        iyzipay.checkoutForm.retrieve(request, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

module.exports = {
    getIyzipayInstance,
    checkoutFormInitialize,
    retrieveCheckoutFormResult
};
