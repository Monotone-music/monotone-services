const router = require('express').Router();
const trackController = require('../controller/tracks_controller');
const {uploadMultiple, uploadSingle} = require('../middleware/file_parser')

router.get('/stream', trackController.getTrackStream);
router.put('/parse', uploadSingle, trackController.parseTrack);
router.put('/parse-many', uploadMultiple, trackController.parseTrack);
router.get('/stream/:recordingId', trackController.getTrackStream);

module.exports = router;