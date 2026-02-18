require('dotenv').config();
const PaytrService = require('./services/paytr.service');

console.log('--- PayTR Credential Test ---');
const mid = process.env.PAYTR_MERCHANT_ID;
const mkey = process.env.PAYTR_MERCHANT_KEY;
const msalt = process.env.PAYTR_MERCHANT_SALT;

console.log('MERCHANT_ID:', mid ? (mid.substring(0, 2) + '***') : 'MISSING/UNDEFINED');
console.log('MERCHANT_KEY:', mkey ? 'EXISTS (Len: ' + mkey.length + ')' : 'MISSING/UNDEFINED');
console.log('MERCHANT_SALT:', msalt ? 'EXISTS' : 'MISSING/UNDEFINED');
console.log('TEST_MODE:', process.env.PAYTR_TEST_MODE);

if (!mid || !mkey || !msalt) {
    console.error('CRITICAL: PayTR credentials are missing in .env match!');
    process.exit(1);
}

try {
    const token = PaytrService.generateToken({
        user_ip: '127.0.0.1',
        merchant_oid: 'TEST-' + Date.now(),
        email: 'test@example.com',
        payment_amount: '1.00',
        payment_type: 'card',
        installment_count: 0,
        currency: 'TL',
        test_mode: '1',
        non_3d: '0'
    });
    console.log('Token Generation: SUCCESS');
    console.log('Generated Token:', token);
} catch (error) {
    console.error('Token Generation: FAILED', error);
}
