const { createClient } = require('@supabase/supabase-js');
const IyzicoProvider = require('./iyzicoProvider');
const PaytrProvider = require('./paytrProvider');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class PaymentProviderFactory {
    constructor() {
        this.providers = {};
    }

    /**
     * Get the active provider instance
     * @returns {Promise<SubscriptionProviderInterface>}
     */
    async getProvider() {
        // 1. Check Env or DB for Active Provider Name
        let providerName = process.env.PAYMENT_PROVIDER || 'iyzico';
        let providerSettings = null;

        try {
            // Fetch Active Provider Name and Settings validation
            const { data: activeSetting } = await supabase
                .from('payment_providers')
                .select('name')
                .eq('is_active', true)
                .maybeSingle();

            if (activeSetting) providerName = activeSetting.name;

            // Fetch Settings for this provider
            const { data: settings } = await supabase
                .from('payment_settings')
                .select('*')
                .eq('provider', providerName)
                .maybeSingle();

            providerSettings = settings;
        } catch (e) {
            console.warn('DB Provider Settings Check Failed:', e.message);
        }

        // Initialize if not cached OR if we want to ensure fresh settings? 
        // For now, caching is fine but if settings change we might need to invalidate.
        // Let's create new instance every time to ensure fresh settings from DB, 
        // OR rely on server restart. Given this is critical payment, let's re-instantiate or check if settings match?
        // Simpler: Just re-instantiate. JS object creation is cheap.

        switch (providerName) {
            case 'iyzico':
                return new IyzicoProvider({
                    apiKey: providerSettings?.api_key,
                    secretKey: providerSettings?.secret_key,
                    baseUrl: providerSettings?.base_url || (providerSettings?.mode === 'live' ? 'https://api.iyzipay.com' : 'https://sandbox-api.iyzipay.com')
                });
            case 'paytr':
                return new PaytrProvider(providerSettings); // Adapt as needed
            default:
                throw new Error(`Provider ${providerName} not supported`);
        }
    }
}

module.exports = new PaymentProviderFactory();
