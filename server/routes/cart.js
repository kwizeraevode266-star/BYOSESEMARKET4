const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected cart routes
router.use(authMiddleware);

router.post('/add', cartController.addToCart);
router.get('/', cartController.getUserCart);
router.post('/remove', cartController.removeFromCart);
router.post('/clear', cartController.clearCart);

module.exports = router;
