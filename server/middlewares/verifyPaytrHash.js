const PaytrService = require('../services/paytr.service');

const verifyPaytrHash = async (req, res, next) => {
    if (!req.body || !req.body.hash) {
        return res.status(400).send('No hash provided');
    }

    try {
        const isValid = await PaytrService.verifyCallbackHash(req.body);
        if (!isValid) {
            console.error('Invalid PayTR Hash');
            return res.status(400).send('Invalid Hash');
        }
        next();
    } catch (err) {
        console.error('Hash Verification Error:', err);
        return res.status(500).send('Verification Error');
    }
};

module.exports = verifyPaytrHash;
