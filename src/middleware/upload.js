const multer = require('multer');
const path = require('path');
const os = require('os');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isServerless
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../../uploads');

function ensureUploadDir() {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (err) {
    console.warn('[Upload] Notice creating upload dir:', err.message);
  }
}
ensureUploadDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginal);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common academic formats: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP, Images
  const allowedExtensions = /\.(pdf|doc|docx|ppt|pptx|txt|zip|png|jpg|jpeg)$/i;
  if (file.originalname.match(allowedExtensions)) {
    cb(null, true);
  } else {
    cb(new Error('File format not supported. Please upload a PDF, Word document, PPT, TXT, ZIP, or image.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit
  fileFilter: fileFilter
});

module.exports = upload;
