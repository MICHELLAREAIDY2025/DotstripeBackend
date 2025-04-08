const express = require('express');
const { addToCart, getCart, removeFromCart, getCartWithProducts, updateCartItem } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.post('/add', protect, addToCart);
router.get('/', protect, getCart);
router.delete('/:product_id', protect, removeFromCart);

// New routes
router.get('/with-products', protect, getCartWithProducts);  // ✅ Added protect
router.put('/:product_id', protect, updateCartItem); 

module.exports = router;
