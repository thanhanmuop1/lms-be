const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, authorizeAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes - cần cả authMiddleware và authorizeAdmin
router.get('/users', authMiddleware, authorizeAdmin, authController.getAllUsers);

module.exports = router;