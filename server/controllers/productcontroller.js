const Product = require('../models/product');

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const { title, description, price, image, category, stock } = req.body || {};
        if (!title || typeof price === 'undefined') return res.status(400).json({ success: false, message: 'Title and price required' });
        const p = new Product({ title, description, price, image, category, stock });
        await p.save();
        return res.json({ success: true, product: p });
    } catch (err) {
        console.error('createProduct error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all products (with optional query filters)
exports.getAllProducts = async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        const products = await Product.find(filter).sort({ createdAt: -1 });
        return res.json({ success: true, products });
    } catch (err) {
        console.error('getAllProducts error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get product by id
exports.getProductById = async (req, res) => {
    try {
        const prod = await Product.findById(req.params.id);
        if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
        return res.json({ success: true, product: prod });
    } catch (err) {
        console.error('getProductById error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const updates = req.body || {};
        const prod = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
        return res.json({ success: true, product: prod });
    } catch (err) {
        console.error('updateProduct error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const prod = await Product.findByIdAndDelete(req.params.id);
        if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
        return res.json({ success: true });
    } catch (err) {
        console.error('deleteProduct error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
