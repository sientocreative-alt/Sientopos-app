const Product = require('../models/Product');
const Category = require('../models/Category');

// --- Categories ---
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort('order');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, image, order } = req.body;
        const category = new Category({ name, image, order });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- Products ---
exports.getProducts = async (req, res) => {
    try {
        const { category } = req.query;
        let query = { isAvailable: true };

        if (category) {
            query.category = category;
        }

        const products = await Product.find(query).populate('category');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { isAvailable: false }); // Soft delete
        res.json({ message: 'Product removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
