const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().select('-enrolledStudents');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/my-courses', auth, async (req, res) => {
    try {
        const courses = await Course.find({
            'enrolledStudents.student': req.user.id
        });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:courseId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/enroll/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const existingEnrollment = course.enrolledStudents.find(
            enrollment => enrollment.student.toString() === req.user.id
        );

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        course.enrolledStudents.push({
            student: req.user.id,
            paymentStatus: 'pending'
        });
        await course.save();

        res.json({ message: 'Successfully enrolled in course' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/:courseId/payment', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const studentIndex = course.enrolledStudents.findIndex(
            enrollment => enrollment.student.toString() === req.user.id
        );

        if (studentIndex === -1) {
            course.enrolledStudents.push({
                student: req.user.id,
                paymentStatus: 'completed',
                enrolledAt: new Date()
            });
        } else {
            course.enrolledStudents[studentIndex].paymentStatus = 'completed';
        }

        await course.save();
        res.json({ message: 'Payment successful' });
    } catch (err) {
        res.status(500).json({ message: 'Payment processing error' });
    }
});

router.post('/:courseId/unenroll', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const studentIndex = course.enrolledStudents.findIndex(
            enrollment => enrollment.student.toString() === req.user.id
        );

        if (studentIndex === -1) {
            return res.status(400).json({ message: 'Not enrolled in this course' });
        }

        course.enrolledStudents.splice(studentIndex, 1);
        await course.save();

        res.json({ message: 'Successfully unenrolled from course' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/lessons/:lessonId/video-progress', auth, async (req, res) => {
    try {
        const course = await Course.findOne({
            'lessons._id': req.params.lessonId
        });

        if (!course) return res.status(404).json({ message: 'Lesson not found' });

        const lesson = course.lessons.id(req.params.lessonId);
        const progress = lesson.videoProgress?.find(
            p => p.userId.toString() === req.user.id
        );

        res.json(progress || { lastPosition: 0, completed: false });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/lessons/:lessonId/video-progress', auth, async (req, res) => {
    try {
        const { watchedDuration, lastPosition, completed } = req.body;
        const course = await Course.findOne({
            'lessons._id': req.params.lessonId
        });

        if (!course) return res.status(404).json({ message: 'Lesson not found' });

        const lesson = course.lessons.id(req.params.lessonId);
        let progress = lesson.videoProgress?.find(
            p => p.userId.toString() === req.user.id
        );

        if (progress) {
            progress.watchedDuration = watchedDuration;
            progress.lastPosition = lastPosition;
            progress.completed = completed;
        } else {
            lesson.videoProgress = lesson.videoProgress || [];
            lesson.videoProgress.push({
                userId: req.user.id,
                watchedDuration,
                lastPosition,
                completed
            });
        }

        await course.save();
        res.json({ message: 'Progress updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/lessons/:lessonId/quiz-progress', auth, async (req, res) => {
    try {
        const course = await Course.findOne({
            'lessons._id': req.params.lessonId
        });

        if (!course) return res.status(404).json({ message: 'Lesson not found' });

        const lesson = course.lessons.id(req.params.lessonId);
        if (!lesson?.quiz) return res.status(404).json({ message: 'Quiz not found' });

        const userAttempts = lesson.quiz.attempts?.filter(
            attempt => attempt.userId.toString() === req.user.id
        ) || [];

        res.json({
            attempts: userAttempts,
            passed: userAttempts.some(attempt => attempt.score >= 70)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching quiz progress' });
    }
});

router.post('/lessons/:lessonId/submit-quiz', auth, async (req, res) => {
    try {
        const course = await Course.findOne({
            'lessons._id': req.params.lessonId
        });

        if (!course) return res.status(404).json({ message: 'Lesson not found' });

        const lesson = course.lessons.id(req.params.lessonId);
        if (!lesson?.quiz) return res.status(404).json({ message: 'Quiz not found' });

        let correctAnswers = 0;
        const totalQuestions = lesson.quiz.questions.length;

        req.body.answers.forEach(answer => {
            const question = lesson.quiz.questions.find(q => q.questionId === answer.questionId);
            if (question?.correctAnswer === answer.selectedAnswer) {
                correctAnswers++;
            }
        });

        const score = Math.round((correctAnswers / totalQuestions) * 100);
        
        if (!lesson.quiz.attempts) {
            lesson.quiz.attempts = [];
        }

        lesson.quiz.attempts.push({
            userId: req.user.id,
            answers: req.body.answers,
            score,
            completed: true,
            attemptDate: new Date()
        });

        await course.save();

        res.json({
            score,
            passed: score >= 70
        });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting quiz' });
    }
});

router.get('/:courseId/progress', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const progress = {
            completedLessons: [],
            quizResults: []
        };

        course.lessons.forEach(lesson => {
            if (lesson.quiz?.attempts) {
                const userAttempts = lesson.quiz.attempts.filter(
                    attempt => attempt.userId.toString() === req.user.id
                );
                
                if (userAttempts.some(attempt => attempt.passed)) {
                    progress.completedLessons.push(lesson._id);
                }
                
                progress.quizResults.push({
                    lessonId: lesson._id,
                    attempts: userAttempts
                });
            }
        });

        res.json(progress);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching progress' });
    }
});

module.exports = router;