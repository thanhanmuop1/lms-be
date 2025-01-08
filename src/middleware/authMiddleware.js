const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Gán thông tin user vào request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const isTeacher = async (req, res, next) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ giáo viên mới có quyền truy cập tài nguyên này'
            });
        }
        next();
    } catch (error) {
        console.error('Error in isTeacher middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi kiểm tra quyền truy cập'
        });
    }
};

module.exports = {
    authMiddleware,
    isTeacher
}; 