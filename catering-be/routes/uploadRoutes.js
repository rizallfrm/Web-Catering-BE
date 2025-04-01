const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Route untuk upload gambar, hanya admin yang bisa mengakses
router.post('/image', authenticate, authorize(['admin']), uploadController.uploadImage);

module.exports = router;