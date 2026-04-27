const express = require('express');
const router = express.Router();
const orderController = require('../controllers/ordercontroller');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', orderController.createOrder);
router.get('/', authMiddleware, orderController.getUserOrders);
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);

module.exports = router;
