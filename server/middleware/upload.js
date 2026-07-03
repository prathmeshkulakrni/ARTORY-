const multer = require('multer');
const path = require('path');
const fs = require('fs');

const os = require('os');

// Ensure uploads directory exists (use temp directory in serverless environments)
const uploadDir = process.env.NETLIFY ? os.tmpdir() : path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (mkdirErr) {
  console.warn('⚠️ Warning: Failed to create upload directory:', mkdirErr.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|pdf|doc|docx|zip|rar/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) cb(null, true);
  else cb(new Error('Only images, videos, documents, and archives are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

module.exports = upload;
