const fs = require('fs');
require('dotenv').config();
try {
    console.log('Loading PaymentManager...');
    require('./services/payment/paymentManager.js');
    console.log('PaymentManager loaded successfully.');
} catch (error) {
    fs.writeFileSync('error_log.txt', error.message + '\n' + error.stack);
    process.exit(1);
}
