const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    enrolledCourses: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed'],
            default: 'pending'
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;