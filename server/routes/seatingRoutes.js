const express = require('express');
const router = express.Router();
const seatingController = require('../controllers/seatingController');

// Request to reorder seating areas
// Currently open, could be protected with generic auth if needed
router.put('/reorder', seatingController.reorderAreas);

module.exports = router;
