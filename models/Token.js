const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 
    }
});

tokenSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            await this.constructor.deleteMany({ userId: this.userId });
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;