const Iyzipay = require('iyzipay');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const IyzicoService = {
    async getCredentials() {
        // Fetch from DB or Env
        const { data } = await supabase
            .from('payment_settings')
            .select('*')
            .eq('provider', 'iyzico')
            .single();

        const dbApiKey = data?.api_key && data.api_key.trim() !== '' ? data.api_key : null;
        const dbSecretKey = data?.secret_key && data.secret_key.trim() !== '' ? data.secret_key : null;

        const apiKey = dbApiKey || process.env.IYZICO_API_KEY;
        const secretKey = dbSecretKey || process.env.IYZICO_SECRET_KEY;
        const baseUrl = data?.mode === 'live' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com';

        const logMsg = `[${new Date().toISOString()}] Init Iyzico: Mode=${data?.mode}, BaseUrl=${baseUrl}, APIKey=${apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING'}, SecretKey=${secretKey ? secretKey.substring(0, 20) + '...' : 'MISSING'}\n`;

        try {
            fs.appendFileSync(path.join(__dirname, '../../iyzico_debug.log'), logMsg);
        } catch (e) { console.error('Log Error:', e); }

        return {
            apiKey,
            secretKey,
            baseUrl
        };
    },

    async createIyzipayInstance() {
        const creds = await this.getCredentials();
        return new Iyzipay({
            apiKey: creds.apiKey,
            secretKey: creds.secretKey,
            uri: creds.baseUrl
        });
    },

    async createPayment(data) {
        const iyzipay = await this.createIyzipayInstance();

        return new Promise((resolve, reject) => {
            const request = {
                locale: 'tr',
                conversationId: data.orderId,
                price: data.amount.toString(),
                paidPrice: data.amount.toString(),
                currency: 'TRY',
                installment: '1',
                basketId: data.orderId,
                paymentChannel: 'WEB',
                paymentGroup: 'PRODUCT',
                callbackUrl: `${process.env.VITE_API_URL || 'http://localhost:5000'}/api/payment/callback/iyzico`,

                paymentCard: {
                    cardHolderName: data.card.holderName,
                    cardNumber: data.card.number,
                    expireMonth: data.card.expireMonth,
                    expireYear: data.card.expireYear,
                    cvc: data.card.cvc,
                    // registerCard removed
                },

                buyer: {
                    id: data.user.id || 'USER-001',
                    name: data.user.name || 'J.',
                    surname: data.user.surname || 'Doe',
                    gsmNumber: data.user.phone || '+905555555555',
                    email: data.user.email,
                    identityNumber: '11111111111',
                    lastLoginDate: '2023-01-01 12:00:00',
                    registrationDate: '2023-01-01 12:00:00',
                    registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
                    ip: data.ip || '85.34.78.112',
                    city: 'Istanbul',
                    country: 'Turkey',
                    zipCode: '34732'
                },

                shippingAddress: {
                    contactName: data.user.name || 'Jane Doe',
                    city: 'Istanbul',
                    country: 'Turkey',
                    address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
                    zipCode: '34742'
                },

                billingAddress: {
                    contactName: data.user.name || 'Jane Doe',
                    city: 'Istanbul',
                    country: 'Turkey',
                    address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
                    zipCode: '34742'
                },

                basketItems: [
                    {
                        id: data.planId || 'SUB-001',
                        name: `Abonelik - ${data.period}`,
                        category1: 'Subscription',
                        itemType: 'VIRTUAL',
                        price: data.amount.toString()
                    }
                ]
            };

            iyzipay.payment.create(request, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },

    async create3DSPayment(data) {
        // Init 3DS
        try {
            const logMsg = `[${new Date().toISOString()}] 3DS Init Payload: ${JSON.stringify(data)}\n`;
            fs.appendFileSync(path.join(__dirname, '../../iyzico_debug.log'), logMsg);
        } catch (e) { console.error('Log Error:', e); }

        const iyzipay = await this.createIyzipayInstance();

        return new Promise((resolve, reject) => {
            const request = {
                locale: 'tr',
                conversationId: data.orderId,
                price: data.amount.toString(),
                paidPrice: data.amount.toString(),
                currency: 'TRY',
                installment: '1',
                basketId: data.orderId,
                paymentChannel: 'WEB',
                paymentGroup: 'PRODUCT',
                callbackUrl: `${process.env.VITE_API_URL || 'http://localhost:5000'}/api/payment/callback/iyzico`,

                paymentCard: {
                    cardHolderName: data.card.holderName,
                    cardNumber: data.card.number,
                    expireMonth: data.card.expireMonth,
                    expireYear: data.card.expireYear,
                    cvc: data.card.cvc,
                    // registerCard removed
                },

                buyer: {
                    id: data.user.id || 'USER-001',
                    name: data.user.name || 'Misafir',
                    surname: data.user.surname || 'Kullanıcı',
                    gsmNumber: data.user.phone || '+905555555555',
                    email: data.user.email,
                    identityNumber: '11111111111',
                    lastLoginDate: '2023-01-01 12:00:00',
                    registrationDate: '2023-01-01 12:00:00',
                    registrationAddress: 'Dijital Hizmet',
                    ip: data.ip || '127.0.0.1',
                    city: 'Istanbul',
                    country: 'Turkey',
                    zipCode: '34732'
                },

                shippingAddress: {
                    contactName: data.user.name || 'Misafir',
                    city: 'Istanbul',
                    country: 'Turkey',
                    address: 'Dijital Hizmet',
                    zipCode: '34742'
                },

                billingAddress: {
                    contactName: data.user.name || 'Misafir',
                    city: 'Istanbul',
                    country: 'Turkey',
                    address: 'Dijital Hizmet',
                    zipCode: '34742'
                },
                basketItems: [
                    {
                        id: data.planId || 'SUB-001',
                        name: `Abonelik - ${data.period}`,
                        category1: 'Subscription',
                        itemType: 'VIRTUAL',
                        price: data.amount.toString()
                    }
                ]
            };

            try {
                const logReq = `[${new Date().toISOString()}] 3DS FINAL REQUEST: ${JSON.stringify(request)}\nENV CHECK: VITE_API_URL=${process.env.VITE_API_URL}, NODE_ENV=${process.env.NODE_ENV}\n`;
                fs.appendFileSync(path.join(__dirname, '../../iyzico_debug.log'), logReq);
            } catch (e) { console.error('Log Error:', e); }

            iyzipay.threedsInitialize.create(request, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },

    async complete3DSPayment(paymentId, conversationData) {
        const iyzipay = await this.createIyzipayInstance();

        return new Promise((resolve, reject) => {
            iyzipay.threedsPayment.create({
                locale: 'tr',
                conversationId: conversationData,
                paymentId: paymentId
            }, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
};

module.exports = IyzicoService;
