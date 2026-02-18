const axios = require('axios');

const API_URL = 'http://localhost:5000/api/subscription';
const BUSINESS_ID = '00000000-0000-0000-0000-000000000000'; // Valid UUID format

async function testEndpoints() {
    try {
        console.log('Testing GET /api/subscription/:businessId...');
        // Should return 200 with { status: 'success', subscription: null } if not found
        const resGet = await axios.get(`${API_URL}/${BUSINESS_ID}`);
        console.log('GET Response:', resGet.status, resGet.data);

        if (resGet.status === 200 && resGet.data.status === 'success') {
            console.log('SUCCESS: GET endpoint working.');
        } else {
            console.error('FAILURE: GET endpoint failed.');
        }

    } catch (error) {
        console.error('Test Error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

testEndpoints();
