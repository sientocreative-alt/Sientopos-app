const axios = require('axios');

const API_URL = 'http://localhost:5000/api/plans';

async function testApi() {
    console.log('Testing GET Plans (Public)...');
    try {
        const res = await axios.get(API_URL);
        console.log('GET /api/plans Status:', res.status);
    } catch (error) {
        console.error('GET /api/plans Failed:', error.response ? error.response.status : error.message);
    }

    console.log('\nTesting POST Plan (Admin)...');
    try {
        const res = await axios.post(`${API_URL}/admin`, {
            name: "Test Plan",
            description: "Test",
            monthly_price: 10,
            yearly_price: 100,
            features: ["Test Feature"]
        });
        console.log('POST /api/plans/admin Status:', res.status);
        console.log('Data:', res.data);
    } catch (error) {
        console.error('POST /api/plans/admin Failed:', error.response ? error.response.status : error.message);
        console.error('Data:', error.response ? error.response.data : '');
    }
}

testApi();
