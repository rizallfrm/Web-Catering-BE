const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // Gunakan memory storage untuk ImageKit

const fileFilter = (req, file, cb) => {
  // Hanya terima gambar
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batas 5MB
  }
});

module.exports = upload;