const axios = require('axios');

const API_URL = 'http://localhost:5000/api/payment';

// Mock Data
const paymentData = {
    orderId: 'TEST-SWITCH-' + Date.now(),
    amount: 100.00,
    user: {
        id: 'USER-TEST',
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
        phone: '+905555555555'
    },
    // Card for Iyzico (PayTR uses iframe)
    card: {
        holderName: 'Test User',
        number: '5528790000000001', // Mastercard
        expireMonth: '12',
        expireYear: '2025',
        cvc: '123'
    }
};

async function testSwitch() {
    try {
        console.log('--- STARTING PROVIDER SWITCH TEST ---');

        // 1. Set Active Provider to Iyzico
        console.log('\nStep 1: Setting Active Provider to Iyzico...');
        await axios.post(`${API_URL}/set-active-provider`, { provider: 'iyzico' });
        console.log('Provider set to Iyzico.');

        // 2. Create Payment (Expect Iyzico HTML)
        console.log('Step 2: Creating Payment (Expect Iyzico)...');
        try {
            const res1 = await axios.post(`${API_URL}/create`, paymentData);
            console.log('Response Status:', res1.status);
            if (res1.data.provider === 'iyzico' && res1.data.htmlContent) {
                console.log('SUCCESS: Iyzico Payment Created (HTML received).');
            } else {
                console.error('FAILURE: Expected Iyzico response, got:', res1.data);
            }
        } catch (err) {
            console.error('Iyzico Create Error:', err.response?.data || err.message);
        }

        // 3. Set Active Provider to PayTR
        console.log('\nStep 3: Setting Active Provider to PayTR...');
        await axios.post(`${API_URL}/set-active-provider`, { provider: 'paytr' });
        console.log('Provider set to PayTR.');

        // 4. Create Payment (Expect PayTR Token)
        console.log('Step 4: Creating Payment (Expect PayTR)...');
        try {
            // Need unique orderId for PayTR to avoid dupes?
            paymentData.orderId = 'TEST-SWITCH-PAYTR-' + Date.now();
            const res2 = await axios.post(`${API_URL}/create`, paymentData);
            console.log('Response Status:', res2.status);
            if (res2.data.provider === 'paytr' && res2.data.token) {
                console.log('SUCCESS: PayTR Payment Created (Token received).');
            } else {
                console.error('FAILURE: Expected PayTR response, got:', res2.data);
            }
        } catch (err) {
            console.error('PayTR Create Error:', err.response?.data || err.message);
            // Note: PayTR might fail if credentials are not valid in DB, but we want to see if it TRIED to use PayTR.
            // If error message is "PayTR Token Failed" or similar, it means switching worked!
        }

        // 5. Cleanup - Set back to Iyzico (Default)
        console.log('\nStep 5: Cleaning up (Revert to Iyzico)...');
        await axios.post(`${API_URL}/set-active-provider`, { provider: 'iyzico' });
        console.log('Done.');

    } catch (error) {
        console.error('Test Script Error:', error.message);
    }
}

testSwitch();
