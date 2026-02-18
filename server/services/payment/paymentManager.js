const { createClient } = require('@supabase/supabase-js');
const IyzicoService = require('./iyzicoService');
const PaytrService = require('./paytrService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PaymentManager = {
    async getActiveProvider() {
        // 1. Check DB for active provider (priority 1)
        try {
            const { data, error } = await supabase
                .from('payment_providers')
                .select('name')
                .eq('is_active', true)
                .order('priority', { ascending: true })
                .limit(1)
                .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

            if (data && data.name) {
                return data.name;
            }
        } catch (err) {
            console.warn('DB Provider check failed, using fallback');
        }

        // 2. Fallback to Env Variable (SaaS Safety)
        const envProvider = process.env.PAYMENT_PROVIDER;
        if (envProvider && ['iyzico', 'paytr'].includes(envProvider)) {
            console.log(`Using fallback provider from ENV: ${envProvider}`);
            return envProvider;
        }

        console.warn('No active provider found in DB or ENV, defaulting to Iyzico (Sandbox)');
        return 'iyzico';
    },

    async createPayment(paymentData) {
        const providerName = await this.getActiveProvider();
        console.log(`PaymentManager: Routing payment to ${providerName}`);

        try {
            if (providerName === 'iyzico') {
                // Iyzico 3DS Init
                const result = await IyzicoService.create3DSPayment(paymentData);

                if (result.status === 'success') {
                    // Iyzico returns HTML content for 3DS
                    return {
                        status: 'success',
                        provider: 'iyzico',
                        htmlContent: result.threeDSHtmlContent, // Frontend should render this
                        redirect: false // It's a form post, effectively a redirect but handled via HTML
                    };
                } else {
                    throw new Error(result.errorMessage || 'Iyzico init failed');
                }
            }
            else if (providerName === 'paytr') {
                // PayTR Iframe Init
                const result = await PaytrService.createPayment(paymentData);
                return {
                    status: 'success',
                    provider: 'paytr',
                    token: result.token,
                    iframeUrl: result.iframeUrl,
                    redirect: false // Frontend renders iframe
                };
            }
            else {
                throw new Error('Unknown provider: ' + providerName);
            }
        } catch (error) {
            console.error('PaymentManager Error:', error);
            throw error;
        }
    }
};

module.exports = PaymentManager;
