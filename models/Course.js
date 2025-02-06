// backend/models/Course.js
const mongoose = require('mongoose');

// Схема для отслеживания прогресса видео
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

// Схема для ответов на квиз
const quizAnswerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        questionId: Number,
        selectedAnswer: Number
    }],
    score: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    attemptDate: {
        type: Date,
        default: Date.now
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

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    questions: [questionSchema],
    timeLimit: Number,
    minPassingScore: {
        type: Number,
        default: 70
    },
    attempts: [quizAnswerSchema]
});

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    videoUrl: String,
    videoProgress: [videoProgressSchema],
    duration: Number, // длительность видео в секундах
    content: String,
    quiz: {
        title: String,
        questions: [questionSchema],
        attempts: [{
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
        }],
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
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Методы для работы с видео
courseSchema.methods.updateVideoProgress = async function(lessonId, userId, progress) {
    const lesson = this.lessons.id(lessonId);
    if (!lesson) return null;

    const videoProgress = lesson.videoProgress.find(
        p => p.userId.toString() === userId.toString()
    );

    if (videoProgress) {
        videoProgress.watchedDuration = progress.watchedDuration;
        videoProgress.lastPosition = progress.lastPosition;
        videoProgress.completed = progress.completed;
    } else {
        lesson.videoProgress.push({
            userId,
            ...progress
        });
    }

    await this.save();
    return lesson;
};

// Методы для работы с квизами
courseSchema.methods.submitQuizAnswers = async function(lessonId, userId, answers) {
    const lesson = this.lessons.id(lessonId);
    if (!lesson || !lesson.quiz) return null;

    const score = calculateQuizScore(lesson.quiz.questions, answers);
    
    lesson.quiz.attempts.push({
        userId,
        answers,
        score,
        completed: true
    });

    await this.save();
    return {
        score,
        passed: score >= lesson.quiz.minPassingScore
    };
};

function calculateQuizScore(questions, answers) {
    let correctAnswers = 0;
    
    answers.forEach(answer => {
        const question = questions.find(q => q.questionId === answer.questionId);
        if (question && question.correctAnswer === answer.selectedAnswer) {
            correctAnswers++;
        }
    });

    return (correctAnswers / questions.length) * 100;
}

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;