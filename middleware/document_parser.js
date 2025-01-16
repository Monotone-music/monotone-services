const multer = require("multer");
const path = require("path");
const uuid = require("uuid");

const documentUploadDir = process.env.DOCUMENT_UPLOAD_DIR;

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuid.v4()}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('File type not allowed'), false);
  }
  cb(null, true);
};

const documentUploadMiddleware = multer({
  storage: documentStorage,
  limits: {fileSize: 1024 * 1024 * 50}, // Limit to 50MB per file
  fileFilter: documentFileFilter
});

const handleDocumentUpload = (uploadFunction) => async (req, res, next) => {
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
    console.error('Failed to process document upload:', error);
    res.status(500).send('Server error: Unable to process upload');
  }
};

const uploadSingleDocument = handleDocumentUpload(documentUploadMiddleware.single('file'));
const uploadMultipleDocuments = handleDocumentUpload(documentUploadMiddleware.array('files', 10)); // Maximum 10 files

module.exports = {uploadSingleDocument, uploadMultipleDocuments};
