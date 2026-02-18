const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');
const paymentController = require('../controllers/payment.controller');

// List saved cards
router.post('/list', cardController.listCards); // Using POST to send userId securely in body

// Prepare store card (initiate 0 value txn or similar flow)
router.post('/store', paymentController.storeCardInit);

// Delete saved card
router.delete('/:ctoken', cardController.deleteCard);

module.exports = router;
