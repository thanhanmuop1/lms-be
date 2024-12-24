const express = require('express');
const router = express.Router();
const lmsControllers = require('../controllers/lmsControllers');
const { authMiddleware, authorizeAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

router.get('/courses', lmsControllers.getAllCourses);
router.get('/videos', lmsControllers.getAllVideos);
router.get('/videos/completed', authMiddleware, lmsControllers.getCompletedVideos);
router.get('/videos/:videoId', lmsControllers.getVideoById);
router.get('/courses/:courseId/chapters', lmsControllers.getChaptersByCourseId);
router.get('/courses/:courseId/videos', lmsControllers.getVideosByCourseId);
router.get('/chapters/:chapterId/videos', lmsControllers.getVideosByChapterId);
router.post('/courses', authMiddleware, lmsControllers.createCourse);
router.delete('/courses/:courseId', authMiddleware, lmsControllers.deleteCourse);
router.put('/courses/:courseId', authMiddleware, lmsControllers.updateCourse);
router.get('/courses/:courseId', lmsControllers.getCourseById);
router.post('/courses/:courseId/chapters', authMiddleware, lmsControllers.createChapter);
router.put('/chapters/:chapterId', authMiddleware, lmsControllers.updateChapter);
router.delete('/chapters/:chapterId', authMiddleware, lmsControllers.deleteChapter);
router.post('/chapters/:chapterId/videos', authMiddleware, lmsControllers.createVideo);
router.put('/videos/:videoId', authMiddleware, lmsControllers.updateVideo);
router.delete('/videos/:videoId', authMiddleware, lmsControllers.deleteVideo);
router.post('/videos/:videoId/mark-watched', authMiddleware, lmsControllers.markVideoAsWatched);

// Cấu hình multer cho upload thumbnail
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/thumbnails');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'thumbnail-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const thumbnailUpload = multer({ 
  storage: thumbnailStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh!'));
    }
  }
});

// Thêm route upload thumbnail
router.post('/courses/upload-thumbnail', authMiddleware, thumbnailUpload.single('thumbnail'), lmsControllers.uploadThumbnail);

// Cập nhật trạng thái public của khóa học (cho cả admin và teacher)
router.put('/courses/:courseId/visibility', authMiddleware, lmsControllers.updateCourseVisibility);

// Thêm route để lấy danh sách học sinh theo khóa học
router.get('/courses/:courseId/students',authMiddleware,lmsControllers.getStudentsByCourse);

// Thêm route để xóa học sinh khỏi khóa học
router.delete('/courses/:courseId/students/:userId', authMiddleware, lmsControllers.removeStudentFromCourse);

module.exports = router;