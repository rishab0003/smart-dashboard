const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController');

// Upload CSV file
router.post('/', protect, uploadController.upload.single('file'), uploadController.processCSV);

// Get upload history
router.get('/', protect, uploadController.getUploadHistory);

// Get specific upload status
router.get('/:id', protect, uploadController.getUploadStatus);

module.exports = router;
