const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    watchedDuration: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    lastPosition: {
        type: Number,
        default: 0
    }
});

const questionSchema = new mongoose.Schema({
    questionId: {
        type: Number,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number,
        required: true
    }
});

const quizAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        questionId: Number,
        selectedAnswer: Number
    }],
    score: Number,
    passed: Boolean,
    attemptDate: {
        type: Date,
        default: Date.now
    }
});

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    videoUrl: String,
    videoProgress: [videoProgressSchema],
    duration: Number,
    content: String,
    quiz: {
        title: String,
        questions: [questionSchema],
        attempts: [quizAttemptSchema],
        completed: {
            type: Boolean,
            default: false
        }
    },
    order: {
        type: Number,
        required: true
    }
});

const enrolledStudentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    instructor: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        required: true
    },
    image: {
        type: String,
        default: 'default-course-image.jpg'
    },
    lessons: [lessonSchema],
    enrolledStudents: [enrolledStudentSchema]
}, {
    timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;