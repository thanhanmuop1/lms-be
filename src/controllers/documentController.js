const multer = require('multer');
const path = require('path');
const fs = require('fs');
const document = require('../models/document');

// Cấu hình multer để lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/documents';
        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Tạo tên file unique bằng timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
    }
});

const documentController = {
    uploadDocument: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const { courseId, chapterId, videoId, title } = req.body;
            
            // Tạo document record trong database
            const documentData = {
                title: title || req.file.originalname, // Sử dụng tên file gốc nếu không có title
                file_path: req.file.path,
                file_type: path.extname(req.file.originalname).substring(1),
                course_id: courseId,
                chapter_id: chapterId || null,
                video_id: videoId || null
            };

            const result = await document.createDocument(documentData);

            res.status(201).json({
                message: 'Document uploaded successfully',
                document: result
            });
        } catch (error) {
            console.error('Error uploading document:', error);
            // Xóa file nếu có lỗi xảy ra khi lưu vào database
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    getDocuments: async (req, res) => {
        try {
            const { courseId, chapterId, videoId } = req.query;
            const documents = await document.getDocuments(courseId, chapterId, videoId);
            res.json(documents);
        } catch (error) {
            console.error('Error getting documents:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    downloadDocument: async (req, res) => {
        try {
            const documentId = req.params.id;
            const doc = await document.getDocumentById(documentId);

            if (!doc) {
                return res.status(404).json({ message: 'Document not found' });
            }

            const filePath = doc.file_path;
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'File not found' });
            }

            res.download(filePath, doc.title + path.extname(filePath));
        } catch (error) {
            console.error('Error downloading document:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    deleteDocument: async (req, res) => {
        try {
            const documentId = req.params.id;
            const doc = await document.getDocumentById(documentId);

            if (!doc) {
                return res.status(404).json({ message: 'Document not found' });
            }

            // Xóa file vật lý
            if (fs.existsSync(doc.file_path)) {
                fs.unlinkSync(doc.file_path);
            }

            // Xóa record trong database
            await document.deleteDocument(documentId);

            res.json({ message: 'Document deleted successfully' });
        } catch (error) {
            console.error('Error deleting document:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = { documentController, upload }; 