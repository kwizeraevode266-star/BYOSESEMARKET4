const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
