const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

async function resolveUser(req) {
    if (!req.user || !req.user.id) return null;
    return await User.findOne({ id: req.user.id });
}

// Create order from user's cart
exports.createOrder = async (req, res) => {
    try {
        const user = await resolveUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const cart = await Cart.findOne({ user: user._id }).populate({ path: 'items.product' });
        if (!cart || !cart.items.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

        const items = cart.items.map(i => ({ product: i.product._id, quantity: i.quantity, price: i.product.price }));
        const totalPrice = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);

        const order = new Order({ user: user._id, items, totalPrice, status: 'pending' });
        await order.save();

        // clear cart
        cart.items = [];
        await cart.save();

        return res.json({ success: true, order });
    } catch (err) {
        console.error('createOrder error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get orders for logged-in user
exports.getUserOrders = async (req, res) => {
    try {
        const user = await resolveUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).populate('items.product');
        return res.json({ success: true, orders });
    } catch (err) {
        console.error('getUserOrders error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update order status (admin or owner)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body || {};
        if (!status) return res.status(400).json({ success: false, message: 'status required' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        order.status = status;
        await order.save();
        return res.json({ success: true, order });
    } catch (err) {
        console.error('updateOrderStatus error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
