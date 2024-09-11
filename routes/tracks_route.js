const router = require('express').Router();
const trackController = require('../controller/tracks_controller');

router.get('/get', trackController.streamTrack);

module.exports = router;