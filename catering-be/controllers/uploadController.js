require ('dotenv').config();
const ImageKit = require('imagekit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.URL_ENDPOINT
});

// Konfigurasi Multer untuk penyimpanan sementara
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'tmp/uploads';
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate nama file unik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter untuk hanya menerima file gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan!'), false);
  }
};

// Konfigurasi upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// Helper untuk mengunggah gambar ke ImageKit
const uploadToImageKit = async (filePath, fileName) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: '/menu-images'
    });
    
    // Hapus file sementara setelah upload
    fs.unlinkSync(filePath);
    
    return uploadResponse;
  } catch (error) {
    console.error('Error uploading to ImageKit:', error);
    throw new Error('Gagal mengunggah gambar ke ImageKit');
  }
};

// Controller untuk upload gambar
exports.uploadImage = [
  // Middleware Multer untuk memproses file
  upload.single('image'),
  
  // Handler request
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: "Error",
          isSuccess: false,
          message: "Tidak ada file yang diunggah"
        });
      }
      
      // Upload file ke ImageKit
      const result = await uploadToImageKit(
        req.file.path,
        req.file.filename
      );
      
      res.status(200).json({
        status: "Success",
        isSuccess: true,
        message: "Berhasil mengunggah gambar",
        url: result.url,
        fileId: result.fileId
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        status: "Error",
        isSuccess: false,
        message: error.message || "Terjadi kesalahan saat mengunggah gambar"
      });
    }
  }
];