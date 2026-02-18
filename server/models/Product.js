const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: String,
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    image: String,
    options: [{
        name: String, // e.g., "Porsiyon", "Extras"
        choices: [{
            name: String, // e.g., "1.5 Porsiyon", "Extra Cheese"
            priceDiff: Number, // +50
        }],
        required: {
            type: Boolean,
            default: false
        },
        multiple: {
            type: Boolean,
            default: false
        }
    }],
    isAvailable: {
        type: Boolean,
        default: true,
    }
});

module.exports = mongoose.model('Product', productSchema);
