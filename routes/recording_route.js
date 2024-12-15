const router = require('express').Router();
const recordingController = require('../controller/recording_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.get('/unavailable', validateToken, recordingController.getUnavailableRecordings);
router.patch('/availability/:id', validateToken, recordingController.updateRecordingAvailability);
router.get('/unavailable/count', validateToken, recordingController.countUnavailableRecordings);
router.patch('/reject/:id', validateToken, recordingController.rejectRecordingAvailability);

module.exports = router;