const PaytrService = require('../paytr.service');

class PaytrProvider {
    async createPlan(planData) {
        // PayTR doesn't use "Plans" in the same way (just amount), 
        // so we might return a dummy ref or null.
        return { referenceCode: 'PAYTR_PLAN_' + Date.now() };
    }

    async createCustomer(customerData) {
        // PayTR handles customers often via UToken/CardToken flow implicitly
        // or we just track them in our DB.
        return { referenceCode: 'PAYTR_CUST_' + customerData.email };
    }

    async startSubscription(subscriptionData) {
        // { amount, user: { ip, email, name, ... }, orderId, ... }
        // We need to map the generic input to PayTR Service input.
        // This provider expects `subscriptionData` to contain full context needed by PaytrService.

        // In the generic controller, we will pass enough data.

        const result = await PaytrService.createPayment({
            amount: subscriptionData.amount, // Generic flow must provide amount
            orderId: subscriptionData.orderId,
            user: subscriptionData.user,
            // ... other PayTR specifics if needed
        });

        return {
            token: result.token,
            iframeUrl: result.iframeUrl,
            pageUrl: result.iframeUrl // Map to common interface
        };
    }

    async cancelSubscription(subscriptionReferenceCode) {
        // Logic to cancel recurring in PayTR (if supported via API)
        // Or just update local DB to stop charging.
        return { status: 'cancelled' };
    }

    async getSubscriptionStatus(subscriptionReferenceCode) {
        return { status: 'active' }; // Mock or impl
    }
}

module.exports = PaytrProvider;
