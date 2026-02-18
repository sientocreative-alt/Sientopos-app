const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');

// Public
router.get('/', planController.getPlans);

// Admin (Should be protected in real scenario, implementing basic routes for now)
router.get('/admin/all', planController.getAllPlansAdmin);
router.post('/admin', planController.createPlan);
router.put('/admin/:id', planController.updatePlan);
router.delete('/admin/:id', planController.deletePlan);

module.exports = router;
