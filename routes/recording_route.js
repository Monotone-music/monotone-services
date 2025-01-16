const router = require('express').Router();
const recordingController = require('../controller/recording_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.get('/unavailable', validateToken, recordingController.getPendingRecordings);
router.patch('/availability/:id', validateToken, recordingController.approveRecording);
router.patch('/enqueue/:id', validateToken, recordingController.approveQueuedRecording);
router.get('/unavailable/count', validateToken, recordingController.countUnavailableRecordings);
router.patch('/reject/:id', validateToken, recordingController.rejectRecording);
router.patch('/disable/:id', validateToken, recordingController.disableRecording);

module.exports = router;