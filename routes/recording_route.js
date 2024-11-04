const router = require('express').Router();
const recordingController = require('../controller/recording_controller');
const {uploadSingle, uploadMultiple} = require('../middleware/file_parser');

router.put('/upload-single', uploadSingle, recordingController.putRecording);

module.exports = router;