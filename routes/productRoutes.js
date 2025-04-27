const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);

// Admin routes - protected with authentication and admin role
router.post('/', 
  authenticate, 
  isAdmin, 
  upload.single('image'), // Add multer middleware for image upload
  productController.createProduct
);

router.put('/:id', 
  authenticate, 
  isAdmin, 
  upload.single('image'), // Add multer middleware for image upload
  productController.updateProduct
);

router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);

module.exports = router;