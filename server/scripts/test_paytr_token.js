require('dotenv').config();
const PaytrService = require('../services/paytr.service');

const fs = require('fs');
const path = require('path');

function log(message, data = '') {
    const logStr = `${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
    console.log(logStr);
    fs.appendFileSync(path.join(__dirname, 'paytr_test_output.txt'), logStr);
}

async function testToken() {
    log('Testing PayTR Token Generation...');

    try {
        const creds = await PaytrService.getCredentials();
        log('Loaded Credentials:', {
            merchantId: creds.merchantId,
            testMode: creds.testMode,
            hasKey: !!creds.merchantKey,
            hasSalt: !!creds.merchantSalt
        });

        const params = {
            user_ip: '127.0.0.1',
            merchant_oid: 'IN' + Date.now(),
            email: 'test@example.com',
            payment_amount: '1.00',
            payment_type: 'card',
            installment_count: 0,
            currency: 'TL',
            test_mode: creds.testMode,
            non_3d: '0'
        };

        log('Generating token with params:', params);
        const token = PaytrService.generateToken(params, creds);
        log('Generated Token:', token);

    } catch (error) {
        log('Error:', error.message);
    }
}

testToken();
