const axios = require('axios');
const fs = require('fs');

async function testPayment() {
    try {
        console.log('Testing Payment API...');
        const response = await axios.post('http://localhost:5000/api/payment/create', {
            orderId: 'TEST-' + Date.now(),
            amount: 1.0,
            // period: 'monthly',
            // planId: 'PLAN-001',
            user: {
                id: 'USER-TEST',
                email: 'test@example.com',
                name: 'Test',
                surname: 'User',
                phone: '+905555555555'
            },
            card: {
                holderName: 'Test User',
                number: '5528790000000001',
                expireMonth: '12',
                expireYear: '2025',
                cvc: '123'
            }
        });
        const output = {
            status: response.status,
            data: response.data
        };
        console.log('Response:', JSON.stringify(response.data, null, 2));
        fs.writeFileSync('test_output.json', JSON.stringify(output, null, 2));
    } catch (error) {
        const errOutput = {
            status: error.response?.status || 500,
            data: error.response?.data || error.message
        };
        console.error('Error:', JSON.stringify(errOutput, null, 2));
        fs.writeFileSync('test_output.json', JSON.stringify(errOutput, null, 2));
    }
}

testPayment();
