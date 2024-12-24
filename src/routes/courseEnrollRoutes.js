const express = require('express');
const { 
  enrollInCourse, 
  checkEnrollmentStatus, 
  getTeacherStats,
  getEnrolledCourses,
  getCourseDetails,
  getTeacherEnrollmentDetails
} = require('../controllers/courseEnrollController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Route để lấy danh sách khóa học đã đăng ký
router.get('/enrolled-courses', authMiddleware, getEnrolledCourses);

// Route to enroll in a course
router.post('/enroll', authMiddleware, enrollInCourse);

// Route to check enrollment status
router.get('/check/:courseId', authMiddleware, checkEnrollmentStatus);

// Route to get teacher stats
router.get('/stats', authMiddleware, getTeacherStats);

// Route để lấy thông tin chi tiết khóa học - không cần auth middleware vì ai cũng có thể xem
router.get('/courses/:courseId/details', getCourseDetails);

// Route để lấy thông tin chi tiết khóa học của giáo viên
router.get('/teacher/student-enrollment-details', authMiddleware, getTeacherEnrollmentDetails);

module.exports = router; 