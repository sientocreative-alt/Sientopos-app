const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

router.post('/iyzico', webhookController.handleIyzicoWebhook);
router.post('/paytr', webhookController.handlePaytrWebhook);

module.exports = router;
