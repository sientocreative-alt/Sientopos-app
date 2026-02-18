require('dotenv').config();
const IyzicoService = require('./services/payment/iyzicoService');
const mongoose = require('mongoose');

// Mock Supabase or just rely on env fallback in IyzicoService if it uses it.
// IyzicoService uses Supabase to fetch keys. We might trouble mocking that locally without running server.
// Actually, IyzicoService uses `payment_settings` table.
// If I want to test purely with ENV, I need to make sure IyzicoService uses ENV if DB is empty or force it.

// Let's modify the script to MOCK the DB call if possible, or just run valid test if DB execution is allowed.
// Since I can't mock imports easily in this script without rewriting the service, 
// I will just rely on the service logic. If it fails to connect to Supabase, it will fail.
// But the service imports `supabase-js`.

const run = async () => {
    try {
        console.log('Testing Iyzico Init...');
        const paymentData = {
            orderId: 'TEST-' + Date.now(),
            amount: 1.0,
            user: {
                id: 'USER-TEST',
                name: 'Test',
                surname: 'User',
                email: 'test@example.com',
                phone: '+905555555555',
                ip: '127.0.0.1'
            },
            card: {
                holderName: 'Test User',
                number: '5528790000000001', // Iyzico Test Mastercard
                expireMonth: '12',
                expireYear: '2025',
                cvc: '123'
            }
        };

        const result = await IyzicoService.create3DSPayment(paymentData);
        console.log('Result:', JSON.stringify(result, null, 2));

        const fs = require('fs');
        const path = require('path');
        fs.appendFileSync(path.join(__dirname, 'iyzico_debug.log'), `[DEBUG SCRIPT RESULT] ${JSON.stringify(result)}\n`);

    } catch (error) {
        console.error('Error:', error);
    }
};

run();
