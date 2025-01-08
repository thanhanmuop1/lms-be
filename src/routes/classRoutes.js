const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const classController = require('../controllers/classController');
const { authMiddleware, isTeacher } = require('../middleware/authMiddleware');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = 'uploads/class-thumbnails';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer cho upload thumbnail
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'class-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const thumbnailUpload = multer({
    storage: thumbnailStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, webp)'));
        }
    }
});

// Route upload thumbnail
router.post('/teacher/classes/upload-thumbnail', isTeacher, thumbnailUpload.single('thumbnail'), classController.uploadThumbnail);

// Route lấy danh sách và chi tiết lớp học
router.get('/teacher/classes', isTeacher, classController.getTeacherClasses);
router.get('/teacher/classes/:classId', isTeacher, classController.getClassDetail);

// Routes quản lý lớp học
router.post('/teacher/classes', isTeacher, classController.createClass);
router.put('/teacher/classes/:classId', isTeacher, classController.updateClass);
router.delete('/teacher/classes/:classId', isTeacher, classController.deleteClass);

// Routes quản lý khóa học trong lớp
router.get('/teacher/classes/:classId/courses', isTeacher, classController.getClassCourses);
router.post('/teacher/classes/:classId/courses', isTeacher, classController.addCourseToClass);
router.delete('/teacher/classes/:classId/courses/:courseId', isTeacher, classController.removeCourseFromClass);

// Routes cho học viên
router.get('/student/enrolled-classes', authMiddleware, classController.getEnrolledClasses);
router.post('/student/join-class', authMiddleware, classController.joinClass);
router.delete('/student/classes/:classId/leave', authMiddleware, classController.leaveClass);

// Thêm route mới vào classRoutes
router.get('/student/classes/:classId/courses', authMiddleware, classController.getClassCoursesByStudent);

module.exports = router; 