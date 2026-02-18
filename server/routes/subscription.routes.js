const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');

// Create Plan (Sync)
router.post('/plan', subscriptionController.createPlan);

// Start Subscription (Checkout)
router.post('/start', subscriptionController.startSubscription);

// Cancel
router.post('/cancel', subscriptionController.cancelSubscription);

// Status
router.get('/status/:id', subscriptionController.getStatus);

// Frontend Compatibility
router.post('/subscribe', subscriptionController.startSubscription); // Alias for frontend
router.get('/:businessId', subscriptionController.getSubscription);

module.exports = router;
