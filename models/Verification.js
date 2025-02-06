const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['registration', 'login'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // TTL в секундах (10 минут)
    }
});

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;