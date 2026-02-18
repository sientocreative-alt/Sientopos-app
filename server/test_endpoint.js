const http = require('http');

const businessId = 'ac5b4f66-a768-45b6-ade1-6955a93e160e';
const url = `http://localhost:5000/isletme/qr/feedback/${businessId}`;

console.log(`Testing API: ${url}`);

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
