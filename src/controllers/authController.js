const auth = require('../models/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// Cấu hình nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Thêm verify transporter
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log("Server is ready to take our messages");
    }
});

const register = async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;
        
        // Kiểm tra email đã tồn tại
        const existingUser = await auth.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Kiểm tra username đã tồn tại
        const existingUsername = await auth.getUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Tạo verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Tạo user với role được chỉ định hoặc mặc định là student
        const user = await auth.createUser({
            username,
            email,
            password: hashedPassword,
            full_name,
            role: role || 'student',
            verification_token: verificationToken,
            email_verified: false
        });

        // Gửi email xác thực
        const verificationUrl = `${process.env.BASE_URL}/verify-email/${verificationToken}`;
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: 'Xác thực tài khoản của bạn',
            html: `
                <h1>Xin chào ${full_name || username}!</h1>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng click vào link bên dưới để xác thực email của bạn:</p>
                <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
                    Xác thực email
                </a>
                <p>Hoặc copy link này vào trình duyệt: ${verificationUrl}</p>
                <p>Link này sẽ hết hạn sau 24 giờ.</p>
                <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
            `
        };

        console.log('Attempting to send email...');
        console.log('Mail options:', mailOptions);
        
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');

        res.status(201).json({ 
            message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Detailed error:', error);
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Check your email and password.');
        }
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Thêm hàm xác thực email
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        // Tìm user với token này
        const user = await auth.getUserByVerificationToken(token);
        
        if (!user) {
            // Kiểm tra xem có user nào đã xác thực với token này không
            const verifiedUser = await auth.getUserByVerifiedToken(token);
            if (verifiedUser && verifiedUser.email_verified) {
                return res.status(400).json({ 
                    message: 'Email đã được xác thực trước đó',
                    alreadyVerified: true
                });
            }
            return res.status(400).json({ 
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        // Kiểm tra xem email đã được xác thực chưa
        if (user.email_verified) {
            return res.status(400).json({ 
                message: 'Email đã được xác thực trước đó',
                alreadyVerified: true
            });
        }

        // Cập nhật trạng thái xác thực email
        await auth.verifyEmail(user.id);
        
        res.json({ message: 'Email đã được xác thực thành công' });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Cập nhật hàm login để kiểm tra xác thực email
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Tìm user theo username hoặc email
        const user = await auth.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Kiểm tra xác thực email
        if (!user.email_verified) {
            return res.status(401).json({ 
                message: 'Vui lòng xác thực email trước khi đăng nhập',
                needsVerification: true 
            });
        }

        // Kiểm tra password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Tạo JWT token với đầy đủ thông tin
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email,
                role: user.role // Đảm bảo có trường role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        // Kiểm tra role trước
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }

        const users = await auth.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    getAllUsers
};

