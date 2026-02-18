const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'waiter', 'kitchen'], // 'garson', 'mutfak' could be mapped
        default: 'waiter',
    },
    pin: {
        type: String, // 4-digit pin for quick access/waiters
        // unique: true, 
    },
    fullName: String,
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('User', userSchema);
