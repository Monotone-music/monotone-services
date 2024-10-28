const router = require('express').Router();
const trackController = require('../controller/tracks_controller');
const {uploadMultiple, uploadSingle} = require('../middleware/file_parser')

router.get('/get', trackController.streamTrack);
router.get('/fingerprint', trackController.getTrackFingerprint);
router.get('/stream', trackController.getTrackStream);
router.get('/metadata', trackController.getTrackMetadata);
router.put('/upload-single', uploadSingle, trackController.putTrack);
router.put('/upload-multiple', uploadMultiple, trackController.putTracks);

module.exports = router;