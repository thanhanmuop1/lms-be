const express = require('express');
const router = express.Router();
const { documentController, upload } = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');

// Upload document
router.post('/documents', 
    authMiddleware.authMiddleware, 
    upload.single('file'), 
    documentController.uploadDocument
);

// Get documents
router.get('/documents', documentController.getDocuments);

// Download document
router.get('/documents/:id/download', documentController.downloadDocument);

// Delete document (chỉ admin mới có quyền xóa)
router.delete('/documents/:id', 
    documentController.deleteDocument
);

module.exports = router; 