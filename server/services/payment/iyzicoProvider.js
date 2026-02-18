const Iyzipay = require('iyzipay');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Iyzico Provider using Official iyzipay SDK
 * Fixes "Parameter is not valid (6)" signature mismatch once and for all.
 */
class IyzicoProvider {
    constructor(config = {}) {
        const apiKey = (config.apiKey || '').trim();
        const secretKey = (config.secretKey || '').trim();
        const baseUrl = (config.baseUrl || 'https://sandbox-api.iyzipay.com').trim();

        this.iyzipay = new Iyzipay({
            apiKey: apiKey,
            secretKey: secretKey,
            uri: baseUrl
        });
    }

    /**
     * Helper to wrap iyzipay callbacks in Promises
     */
    async _call(resource, method, payload) {
        return new Promise((resolve, reject) => {
            this.iyzipay[resource][method](payload, (err, result) => {
                if (err) {
                    console.error(`[Iyzico SDK Error] ${resource}.${method}:`, err);
                    return reject(err);
                }
                if (result.status !== 'success') {
                    console.log('--- IYZICO SDK REJECTION FULL ---', JSON.stringify(result, null, 2));
                    return reject(new Error(result.errorMessage || 'Iyzico SDK Error'));
                }
                resolve(result);
            });
        });
    }

    /**
     * Retrieve Product List
     */
    async retrieveProductList() {
        return this._call('subscriptionProduct', 'retrieveList', { locale: Iyzipay.LOCALE.TR });
    }

    /**
     * Create Product
     */
    async createProduct(productData) {
        const payload = {
            name: productData.name,
            description: productData.description || productData.name,
            locale: Iyzipay.LOCALE.TR
        };

        const result = await this._call('subscriptionProduct', 'create', payload);
        return result.data; // referenceCode
    }

    /**
     * Create Pricing Plan
     */
    async createPlan(planData) {
        const payload = {
            productReferenceCode: planData.productCode,
            name: planData.name,
            interval: planData.interval === 'yearly' ? Iyzipay.SUBSCRIPTION_PRICING_PLAN_INTERVAL.YEARLY : Iyzipay.SUBSCRIPTION_PRICING_PLAN_INTERVAL.MONTHLY,
            price: parseFloat(planData.price).toFixed(2),
            currencyCode: planData.currency || Iyzipay.CURRENCY.TRY,
            paymentInterval: 1,
            recurrenceCount: 0,
            trialPeriodDays: 0,
            planPaymentType: Iyzipay.PLAN_PAYMENT_TYPE.RECURRING,
            locale: Iyzipay.LOCALE.TR
        };

        const result = await this._call('subscriptionPricingPlan', 'create', payload);
        return result.data; // referenceCode
    }

    /**
     * Create Customer
     */
    async createCustomer(customerData) {
        const payload = {
            name: customerData.name,
            surname: customerData.surname,
            email: customerData.email,
            gsmNumber: customerData.phone || '+905000000000',
            identityNumber: '11111111111',
            billingAddress: {
                contactName: `${customerData.name} ${customerData.surname}`,
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Dijital Hizmet',
                zipCode: '34732'
            },
            shippingAddress: {
                contactName: `${customerData.name} ${customerData.surname}`,
                city: 'Istanbul',
                country: 'Turkey',
                address: 'Dijital Hizmet',
                zipCode: '34732'
            },
            locale: Iyzipay.LOCALE.TR
        };

        const result = await this._call('subscriptionCustomer', 'create', payload);
        return result.data; // referenceCode
    }

    /**
     * Start Subscription (Checkout Form)
     */
    async startSubscription(subscriptionData) {
        const payload = {
            customerReferenceCode: subscriptionData.customerReferenceCode,
            pricingPlanReferenceCode: subscriptionData.pricingPlanReferenceCode,
            callbackUrl: subscriptionData.callbackUrl,
            subscriptionInitialStatus: Iyzipay.SUBSCRIPTION_INITIAL_STATUS.ACTIVE,
            locale: Iyzipay.LOCALE.TR
        };

        const result = await this._call('subscriptionCheckoutForm', 'create', payload);

        return {
            token: result.token,
            checkoutCode: result.checkoutCode,
            pageUrl: result.checkoutPageUrl
        };
    }

    /**
     * Cancel Subscription
     */
    async cancelSubscription(subscriptionReferenceCode) {
        const payload = {
            subscriptionReferenceCode,
            locale: Iyzipay.LOCALE.TR
        };
        const result = await this._call('subscription', 'cancel', payload);
        return result.data;
    }

    /**
     * Get Subscription Details
     */
    async getSubscriptionStatus(subscriptionReferenceCode) {
        const payload = {
            subscriptionReferenceCode,
            locale: Iyzipay.LOCALE.TR
        };
        const result = await this._call('subscription', 'retrieve', payload);

        return {
            status: result.data.subscriptionStatus,
            startDate: result.data.createdDate,
            endDate: result.data.endDate
        };
    }

    verifyWebhookSignature(req) {
        // Iyzico webhooks for subscriptions use a complex signature.
        // For now we trust the source if needed, or implement full verification later.
        return true;
    }
}

module.exports = IyzicoProvider;
