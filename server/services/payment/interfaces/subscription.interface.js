/**
 * Subscription Provider Interface
 * All payment providers must implement these methods.
 */
class SubscriptionProviderInterface {
    /**
     * Initialize the provider
     * @param {Object} config - Provider configuration
     */
    constructor(config) {
        if (this.constructor === SubscriptionProviderInterface) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.config = config;
    }

    /**
     * Create a new pricing plan (product) on the provider side
     * @param {Object} planData { name, price, currency, interval, period }
     * @returns {Promise<Object>} { referenceCode }
     */
    async createPlan(planData) {
        throw new Error("Method 'createPlan' must be implemented.");
    }

    /**
     * Create a customer on the provider side
     * @param {Object} customerData { name, surname, email, phone, identityNumber, address, etc. }
     * @returns {Promise<Object>} { customerReferenceCode }
     */
    async createCustomer(customerData) {
        throw new Error("Method 'createCustomer' must be implemented.");
    }

    /**
     * Start a subscription (Initialize Checkout)
     * @param {Object} subscriptionData { customerReferenceCode, planReferenceCode, callbackUrl }
     * @returns {Promise<Object>} { htmlContent, token, checkoutUrl }
     */
    async startSubscription(subscriptionData) {
        throw new Error("Method 'startSubscription' must be implemented.");
    }

    /**
     * Cancel a subscription
     * @param {string} subscriptionReferenceCode
     * @returns {Promise<Object>}
     */
    async cancelSubscription(subscriptionReferenceCode) {
        throw new Error("Method 'cancelSubscription' must be implemented.");
    }

    /**
     * Get Subscription Status
     * @param {string} subscriptionReferenceCode
     * @returns {Promise<Object>} { status, ... }
     */
    async getSubscriptionStatus(subscriptionReferenceCode) {
        throw new Error("Method 'getSubscriptionStatus' must be implemented.");
    }

    /**
     * Verify Webhook Signature
     * @param {Object} req - Express request object
     * @returns {boolean}
     */
    verifyWebhookSignature(req) {
        throw new Error("Method 'verifyWebhookSignature' must be implemented.");
    }

    /**
     * Handle Webhook Payload
     * @param {Object} payload
     * @returns {Object} { eventType, subscriptionId, status, meta }
     */
    parseWebhook(payload) {
        throw new Error("Method 'parseWebhook' must be implemented.");
    }
}

module.exports = SubscriptionProviderInterface;
