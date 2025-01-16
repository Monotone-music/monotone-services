const router = require('express').Router();
const trackController = require('../controller/tracks_controller');
const {uploadMultiple, uploadSingle} = require('../middleware/file_parser')

const {validateToken} = require('../middleware/jwt_handler');

router.get('/stream', validateToken, trackController.getTrackStream);
router.put('/parse', validateToken, uploadSingle, trackController.parseTrack);
router.put('/parse-many', validateToken, uploadMultiple, trackController.parseTrack);
router.get('/stream/:recordingId', trackController.getTrackStream);
router.get('/mobile/stream/:recordingId', trackController.getMobileTrackStream);
router.get('/top', validateToken, trackController.getTopTracks);
router.get('/count', validateToken, trackController.getTracksCount);
router.get('/info/:recordingId', validateToken, trackController.getTracksGeneralInfo);

module.exports = router;