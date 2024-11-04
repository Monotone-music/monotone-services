const multer = require("multer");
const path = require("path");
const uuid = require("uuid");

const uploadDir = process.env.UPLOAD_DIR;
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = `${uuid.v4()}`;
//     cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-flac'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('File type not allowed'), false);
  }
  cb(null, true);
};

const uploadMiddleware = multer({
  storage,
  limits: {fileSize: 1024 * 1024 * 100},
  fileFilter
});

const handleUpload = (uploadFunction) => async (req, res, next) => {
  try {
    uploadFunction(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).send(`Multer error: ${err.message}`);
      } else if (err) {
        console.error('Unknown error:', err);
        return res.status(500).send('Server error: Unable to process upload');
      }
      next();
    });
  } catch (error) {
    console.error('Failed to ensure directories exist:', error);
    res.status(500).send('Server error: Unable to process upload');
  }
};

const uploadSingle = handleUpload(uploadMiddleware.single('file'));
const uploadMultiple = handleUpload(uploadMiddleware.array('files', 50));

module.exports = {uploadSingle, uploadMultiple};
