const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

async function resolveUser(req) {
    // token contains custom id in payload (id)
    if (!req.user || !req.user.id) return null;
    return await User.findOne({ id: req.user.id });
}

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const user = await resolveUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { productId, quantity } = req.body || {};
        if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        let cart = await Cart.findOne({ user: user._id });
        if (!cart) {
            cart = new Cart({ user: user._id, items: [] });
        }

        const idx = cart.items.findIndex(i => String(i.product) === String(product._id));
        if (idx > -1) {
            cart.items[idx].quantity += Number(quantity || 1);
        } else {
            cart.items.push({ product: product._id, quantity: Number(quantity || 1) });
        }

        await cart.save();
        const populated = await cart.populate({ path: 'items.product' });
        return res.json({ success: true, cart: populated });
    } catch (err) {
        console.error('addToCart error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get logged-in user's cart
exports.getUserCart = async (req, res) => {
    try {
        const user = await resolveUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const cart = await Cart.findOne({ user: user._id }).populate({ path: 'items.product' });
        return res.json({ success: true, cart: cart || { items: [] } });
    } catch (err) {
        console.error('getUserCart error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove a product from cart or decrement quantity
exports.removeFromCart = async (req, res) => {
    try {
        const user = await resolveUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { productId, removeAll } = req.body || {};
        if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

        const cart = await Cart.findOne({ user: user._id });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        const idx = cart.items.findIndex(i => String(i.product) === String(productId));
        if (idx === -1) return res.status(404).json({ success: false, message: 'Item not in cart' });

        if (removeAll || cart.items[idx].quantity <= 1) {
            cart.items.splice(idx, 1);
        } else {
            cart.items[idx].quantity -= 1;
        }

        await cart.save();
        const populated = await cart.populate({ path: 'items.product' });
        return res.json({ success: true, cart: populated });
    } catch (err) {
        console.error('removeFromCart error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Clear user's cart
exports.clearCart = async (req, res) => {
    try {
        const user = await resolveUser(req);
        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const cart = await Cart.findOne({ user: user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        return res.json({ success: true });
    } catch (err) {
        console.error('clearCart error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
