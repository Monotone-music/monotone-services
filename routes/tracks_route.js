const router = require('express').Router();
const trackController = require('../controller/tracks_controller');

router.get('/get', trackController.streamTrack);
router.get('/fingerprint', trackController.getTrackFingerprint);
router.get('/stream', trackController.getTrackStream);
router.get('/metadata', trackController.getTrackMetadata);

module.exports = router;