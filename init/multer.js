const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-aiff'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only audio files are allowed.'), false); // Reject the file
    }
}

const uploadMiddleware = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB file size limit (adjust as needed)
    fileFilter: fileFilter
});

module.exports = {
    singleUpload: (fieldName) => uploadMiddleware.single(fieldName),
    multipleUpload: (fieldName, maxCount) => uploadMiddleware.array(fieldName, maxCount)
};