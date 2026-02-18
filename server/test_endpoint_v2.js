const http = require('http');

const businessId = '858bc160-fffa-4d75-bd33-0111df8b881c';
const url = `http://localhost:5000/isletme/qr/feedback/${businessId}`;

console.log(`Testing API: ${url}`);

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('Response Success:', parsed.success);
            console.log('Items Count:', parsed.data.length);
            if (parsed.data.length > 0) {
                console.log('First Item:', parsed.data[0].full_name);
            }
        } catch (e) {
            console.log('Raw data:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
