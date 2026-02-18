const axios = require('axios');

const API_URL = 'http://localhost:5000/api/subscription';

const mockUser = {
    name: 'Test',
    surname: 'User',
    email: 'subscription_test_user@example.com',
    phone: '+905555555555',
    id: 'USER-TEST-SUB'
};

async function testSubscriptionFlow() {
    try {
        console.log('--- STARTING SUBSCRIPTION FLOW TEST ---');

        // 1. Create Plan (Admin Action)
        console.log('\nStep 1: Creating Plan...');
        const planName = 'Test Plan ' + Date.now();
        let planId = null;

        // Note: Our API wraps this. Ideally we need a Plan ID from our local DB to pass to startSubscription.
        // But the test script doesn't have direct DB access easily to get the ID back if createPlan only returns Iyzico Ref.
        // Let's look at `plan.controller.js` or `subscription.controller.js`.
        // `subscriptionController.createPlan` returns `referenceCode`. It doesn't seem to insert into local DB in my implementation?
        // Wait, looking at `subscription.controller.js` `createPlan`:
        // It calls provider.createPlan and returns referenceCode. It comments "3. Save to DB... Usually called when Admin creates a plan".
        // Ah, the `PlanController` creates the DB entry. `SubscriptionController.createPlan` is a helper to sync?
        // The endpoint is `POST /api/subscription/plan`.
        // If I use that, it just talks to Iyzico.

        // Flow: 
        // Real app: Admin creates plan in PlanController -> PlanController calls SubscriptionService to sync.
        // Test script: We need a valid `planId` (UUID) in local DB to pass to `/start`.
        // So validation 1 is: Ensure we have a plan in DB.
        // I will assume the 'Başlangıç Paketi' exists from previous migration or I should hit `POST /api/plans` first?
        // `PlanController.createPlan` inserts into DB. Does it sync to Iyzico? Not in current code shown.
        // The user requirement said: "Plan oluşturma ... Plan listeleme".

        // I'll skip creating a NEW plan via API if logic isn't fully wired for sync yet (Task said "Backend: Create IyzicoSubscriptionController...").
        // `SubscriptionController.startSubscription` fetches plan from DB by `planId`.
        // I need a valid `planId`. I'll try to fetch existing plans first.

        console.log('Step 0: Fetching existing plans...');
        const { data: plansRes } = await axios.get('http://localhost:5000/api/plans'); // Public endpoint
        let targetPlan = plansRes.data[0];

        if (!targetPlan) {
            console.error('No plans found in DB. Please run SQL migration or create a plan.');
            return;
        }
        console.log(`Using Plan: ${targetPlan.name} (ID: ${targetPlan.id})`);

        // 2. Start Subscription
        console.log('\nStep 2: Starting Subscription...');
        const startPayload = {
            businessId: 'TEST-BIZ-SUB-' + Date.now(), // Fake business
            planId: targetPlan.id,
            period: 'monthly',
            user: mockUser
        };

        try {
            const res = await axios.post(`${API_URL}/start`, startPayload);
            console.log('Start Subscription Response:', res.status, res.data); // data should contain pageUrl

            if (res.data.status === 'success' && res.data.data.pageUrl) {
                console.log('SUCCESS: Subscription Checkout Page URL received:', res.data.data.pageUrl);
            } else {
                console.error('FAILURE: Unexpected response format.');
            }

        } catch (err) {
            console.log('START_SUBSCRIPTION_ERROR_DETAILS:');
            if (err.response) {
                console.log(JSON.stringify(err.response.data, null, 2));
            } else {
                console.log(err.message);
            }
        }

    } catch (error) {
        console.error('Test Script Error:', error.message);
    }
}

testSubscriptionFlow();
