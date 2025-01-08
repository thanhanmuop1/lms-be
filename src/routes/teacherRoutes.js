const express = require('express');
const teacherController = require('../controllers/teacherController');
const { authMiddleware, authorizeTeacher } = require('../middleware/auth');

const router = express.Router();

// Middleware để kiểm tra quyền giáo viên
router.use(authMiddleware, authorizeTeacher);

// Course routes
router.get('/courses', teacherController.getTeacherCourses);
router.get('/courses/:id', teacherController.getCourseById);
// router.post('/courses', teacherController.createCourse);
// router.put('/courses/:id', teacherController.updateCourse);
// router.delete('/courses/:id', teacherController.deleteCourse);

// Chapter routes
router.get('/courses/:courseId/chapters', teacherController.getCourseChapters);
// router.post('/courses/:courseId/chapters', teacherController.createChapter);
// router.put('/chapters/:id', teacherController.updateChapter);
// router.delete('/chapters/:id', teacherController.deleteChapter);

// Video routes
router.get('/courses/:courseId/videos', teacherController.getCourseVideos);
// router.post('/courses/:courseId/videos', teacherController.addVideo);
// router.put('/videos/:id', teacherController.updateVideo);
// router.delete('/videos/:id', teacherController.deleteVideo);

// Quiz routes
router.get('/quizzes', teacherController.getAllTeacherQuizzes);
router.get('/quizzes/:id', teacherController.getQuizById);
// router.post('/quizzes', teacherController.createQuiz);
// router.put('/quizzes/:id', teacherController.updateQuiz);
// router.delete('/quizzes/:id', teacherController.deleteQuiz);

// Video-Quiz routes
router.get('/videos/:videoId/available-quizzes', teacherController.getAvailableQuizzesForVideo);
// router.post('/videos/:videoId/quiz', teacherController.assignQuizToVideo);
// router.delete('/videos/:videoId/quiz/:quizId', teacherController.unassignQuizFromVideo);

// Question routes
router.get('/quizzes/:quizId/questions', teacherController.getQuizQuestions);
// router.put('/quizzes/:quizId/questions', teacherController.updateQuestions);
// router.delete('/questions/:id', teacherController.deleteQuestion);

// Document routes
router.get('/courses/:courseId/documents', teacherController.getCourseDocuments);
// router.post('/courses/:courseId/documents', upload.single('file'), teacherController.addDocument);
// router.delete('/documents/:id', teacherController.deleteDocument); // Chú ý sau này xoá
// router.get('/documents/:id/download', teacherController.downloadDocument);

module.exports = router; 