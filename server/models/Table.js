const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    name: {
        type: String, // e.g., "Bahçe 1", "Teras 5"
        required: true,
    },
    section: {
        type: String, // e.g., "Bahçe", "Salon", "Teras"
        required: true,
    },
    status: {
        type: String,
        enum: ['empty', 'occupied', 'reserved', 'payment_pending'],
        default: 'empty',
    },
    currentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    }
});

module.exports = mongoose.model('Table', tableSchema);
