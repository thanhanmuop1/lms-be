const express = require('express');
const teacherController = require('../controllers/teacherController');
const { authMiddleware, authorizeTeacher } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Cấu hình multer cho upload document
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');  // Đảm bảo thư mục này tồn tại
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Không đúng định dạng file!'));
    }
  }
});

const router = express.Router();

// Middleware để kiểm tra quyền giáo viên
router.use(authMiddleware, authorizeTeacher);

// Course routes
router.get('/courses', teacherController.getTeacherCourses);
router.get('/courses/:id', teacherController.getCourseById);
router.post('/courses', teacherController.createCourse);
router.put('/courses/:id', teacherController.updateCourse);
router.delete('/courses/:id', teacherController.deleteCourse);

// Chapter routes
router.get('/courses/:courseId/chapters', teacherController.getCourseChapters);
router.post('/courses/:courseId/chapters', teacherController.createChapter);
router.put('/chapters/:id', teacherController.updateChapter);
router.delete('/chapters/:id', teacherController.deleteChapter);

// Video routes
router.get('/courses/:courseId/videos', teacherController.getCourseVideos);
router.post('/courses/:courseId/videos', teacherController.addVideo);
router.put('/videos/:id', teacherController.updateVideo);
router.delete('/videos/:id', teacherController.deleteVideo);

// Quiz routes
router.get('/quizzes', teacherController.getAllTeacherQuizzes);
router.get('/quizzes/:id', teacherController.getQuizById);
router.post('/quizzes', teacherController.createQuiz);
router.put('/quizzes/:id', teacherController.updateQuiz);
router.delete('/quizzes/:id', teacherController.deleteQuiz);

// Video-Quiz routes
router.get('/videos/:videoId/available-quizzes', teacherController.getAvailableQuizzesForVideo);
router.post('/videos/:videoId/quiz', teacherController.assignQuizToVideo);
router.delete('/videos/:videoId/quiz/:quizId', teacherController.unassignQuizFromVideo);

// Question routes
router.get('/quizzes/:quizId/questions', teacherController.getQuizQuestions);
router.post('/quizzes/:quizId/questions', teacherController.addQuestions);
router.put('/quizzes/:quizId/questions', teacherController.updateQuestions);
router.delete('/questions/:id', teacherController.deleteQuestion);

// Document routes
router.get('/courses/:courseId/documents', teacherController.getCourseDocuments);
router.post('/courses/:courseId/documents', upload.single('file'), teacherController.addDocument);
router.delete('/documents/:id', teacherController.deleteDocument); // Chú ý sau này xoá
router.get('/documents/:id/download', teacherController.downloadDocument);

module.exports = router; 