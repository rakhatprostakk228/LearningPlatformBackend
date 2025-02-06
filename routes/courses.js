// routes/courses.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');

// Get all courses (public route)
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all courses...');
        const courses = await Course.find().select('-enrolledStudents');
        console.log(`Found ${courses.length} courses`);
        res.json(courses);
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get enrolled courses (protected route)
router.get('/my-courses', auth, async (req, res) => {
    try {
        console.log('Fetching enrolled courses for user:', req.user.id);
        const courses = await Course.find({
            enrolledStudents: req.user.id
        });
        console.log(`Found ${courses.length} enrolled courses`);
        res.json(courses);
    } catch (err) {
        console.error('Error fetching enrolled courses:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get course details
router.get('/:courseId', async (req, res) => {
    try {
        console.log('Fetching course details for:', req.params.courseId);
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        console.error('Error fetching course details:', err);
        res.status(500).json({ message: err.message });
    }
});

// Enroll in a course
router.post('/enroll/:courseId', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if already enrolled
        if (course.enrolledStudents.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        course.enrolledStudents.push(req.user.id);
        await course.save();

        res.json({ message: 'Successfully enrolled in course' });
    } catch (err) {
        console.error('Error enrolling in course:', err);
        res.status(500).json({ message: err.message });
    }
});

// Unenroll from a course
router.post('/:courseId/unenroll', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const studentIndex = course.enrolledStudents.indexOf(req.user.id);
        if (studentIndex === -1) {
            return res.status(400).json({ message: 'Not enrolled in this course' });
        }

        course.enrolledStudents.splice(studentIndex, 1);
        await course.save();

        res.json({ message: 'Successfully unenrolled from course' });
    } catch (err) {
        console.error('Error unenrolling from course:', err);
        res.status(500).json({ message: err.message });
    }
});

// Получить прогресс видео
router.get('/lessons/:lessonId/video-progress', auth, async (req, res) => {
    try {
        const course = await Course.findOne({
            'lessons._id': req.params.lessonId
        });

        if (!course) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const lesson = course.lessons.id(req.params.lessonId);
        const progress = lesson.videoProgress?.find(
            p => p.userId.toString() === req.user.id
        );

        res.json(progress || { lastPosition: 0, completed: false });
    } catch (err) {
        console.error('Error fetching video progress:', err);
        res.status(500).json({ message: err.message });
    }
});

// Обновить прогресс видео
router.post('/lessons/:lessonId/video-progress', auth, async (req, res) => {
    try {
        const { watchedDuration, lastPosition, completed } = req.body;
        const course = await Course.findOne({
            'lessons._id': req.params.lessonId
        });

        if (!course) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

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
        console.error('Error updating video progress:', err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/lessons/:lessonId/quiz-progress', auth, async (req, res) => {
    try {
      const course = await Course.findOne({
        'lessons._id': req.params.lessonId
      });
  
      if (!course) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
  
      const lesson = course.lessons.id(req.params.lessonId);
      if (!lesson || !lesson.quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
  
      // Фильтруем попытки для текущего пользователя
      const userAttempts = lesson.quiz.attempts?.filter(
        attempt => attempt.userId.toString() === req.user.id.toString()
      ) || [];
  
      res.json({
        attempts: userAttempts,
        passed: userAttempts.some(attempt => attempt.score >= 70)
      });
  
    } catch (err) {
      console.error('Error fetching quiz progress:', err);
      res.status(500).json({ message: 'Error fetching quiz progress' });
    }
  });

// Save quiz progress (partial answers)
router.post('/lessons/:lessonId/quiz-progress', auth, async (req, res) => {
    try {
        const { answers } = req.body;
        const course = await Course.findOne({
            'lessons._id': req.params.lessonId
        });

        if (!course) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const lesson = course.lessons.id(req.params.lessonId);
        if (!lesson.quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        let attempt = lesson.quiz.attempts?.find(
            a => a.userId.toString() === req.user.id
        );

        if (attempt) {
            attempt.answers = { ...attempt.answers, ...answers };
        } else {
            lesson.quiz.attempts = lesson.quiz.attempts || [];
            lesson.quiz.attempts.push({
                userId: req.user.id,
                answers,
                completed: false
            });
        }

        await course.save();
        res.json({ message: 'Quiz progress saved' });
    } catch (err) {
        console.error('Error saving quiz progress:', err);
        res.status(500).json({ message: err.message });
    }
});

// Submit final quiz answers
// Добавьте этот маршрут в courses.js
router.post('/lessons/:lessonId/submit-quiz', auth, async (req, res) => {
    try {
        console.log('Quiz submission received:', {
            lessonId: req.params.lessonId,
            answers: req.body.answers,
            userId: req.user.id
        });

        const course = await Course.findOne({
            'lessons._id': req.params.lessonId
        });

        if (!course) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const lesson = course.lessons.id(req.params.lessonId);
        if (!lesson || !lesson.quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Подсчёт результата
        let correctAnswers = 0;
        const totalQuestions = lesson.quiz.questions.length;

        req.body.answers.forEach(answer => {
            const question = lesson.quiz.questions.find(q => q.questionId === answer.questionId);
            if (question && question.correctAnswer === answer.selectedAnswer) {
                correctAnswers++;
            }
        });

        const score = Math.round((correctAnswers / totalQuestions) * 100);

        // Сохраняем попытку
        if (!lesson.quiz.attempts) {
            lesson.quiz.attempts = [];
        }

        lesson.quiz.attempts.push({
            userId: req.user.id,
            answers: req.body.answers,
            score: score,
            completed: true,
            attemptDate: new Date()
        });

        await course.save();

        console.log('Quiz result:', { score }); // Отладочный лог

        res.json({
            score,
            passed: score >= 70
        });

    } catch (error) {
        console.error('Error in submit-quiz:', error);
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
});

// Get course progress
router.get('/:courseId/progress', auth, async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // Собираем информацию о прогрессе
      const progress = {
        completedLessons: [],
        quizResults: []
      };
  
      course.lessons.forEach(lesson => {
        if (lesson.quiz && lesson.quiz.attempts) {
          const userAttempts = lesson.quiz.attempts.filter(
            attempt => attempt.userId.toString() === req.user.id.toString()
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
      console.error('Error fetching progress:', err);
      res.status(500).json({ message: 'Error fetching progress' });
    }
  });

// Mark lesson as complete
router.post('/:courseId/lessons/:lessonId/complete', auth, async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        let progress = course.progress.find(p => p.student.toString() === req.user.id);
        if (!progress) {
            progress = {
                student: req.user.id,
                completedLessons: [],
                quizResults: []
            };
            course.progress.push(progress);
        }

        if (!progress.completedLessons.includes(parseInt(lessonId))) {
            progress.completedLessons.push(parseInt(lessonId));
        }

        await course.save();
        res.json({ message: 'Lesson marked as complete' });
    } catch (err) {
        console.error('Error marking lesson as complete:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;