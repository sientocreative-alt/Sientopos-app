const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const verifyPaytrHash = require('../middlewares/verifyPaytrHash');

// Initialize payment (create token)
router.post('/create', paymentController.createPayment);

// Iyzico CheckoutForm Init
router.post('/iyzico/init', paymentController.initializeCheckoutForm);

// Callback from PayTR (Webhook)
// Callback from PayTR (Webhook)
router.post('/callback', paymentController.handleCallback); // Keeps compatibility
router.post('/callback/paytr', paymentController.handleCallback);

// Callback from Iyzico
router.post('/callback/iyzico', paymentController.handleIyzicoCallback);

// Initiate payment with saved card

// Initiate payment with saved card

// Get configuration status (masked)
router.get('/config-status', paymentController.getConfigStatus); // Old
router.get('/config-status/all', paymentController.getAllConfigStatus); // New Multi-Provider

// Update configuration
router.post('/update-config', paymentController.updateConfig);

// Set Active Provider
router.post('/set-active-provider', paymentController.setActiveProvider);

module.exports = router;
