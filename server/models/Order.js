const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            name: String,
            price: Number,
            quantity: { type: Number, default: 1 },
            options: [String], // Selected options like "Extra Cheese"
            notes: String,
            status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'cancelled'],
        default: 'open',
    },
    paymentMethod: {
        type: String, // 'cash', 'credit_card', 'multinet', etc.
    },
    waiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    closedAt: Date
});

module.exports = mongoose.model('Order', orderSchema);
