const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');

// Public read access might be needed for QR menu, but writes need auth
router.get('/categories', productController.getCategories);
router.post('/categories', auth, productController.createCategory);
router.put('/categories/:id', auth, productController.updateCategory);

router.get('/products', productController.getProducts);
router.post('/products', auth, productController.createProduct);
router.put('/products/:id', auth, productController.updateProduct);
router.delete('/products/:id', auth, productController.deleteProduct);

module.exports = router;
