const axios = require('axios');

async function debugPlans() {
    try {
        console.log('Fetching Plans from http://localhost:5000/api/plans...');
        const res = await axios.get('http://localhost:5000/api/plans');
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error('Fetch Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

debugPlans();
