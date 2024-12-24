const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Route tìm kiếm khóa học - không cần auth vì ai cũng có thể tìm kiếm
router.get('/courses', searchController.searchCourses);

module.exports = router;