const router = require('express').Router();

const {validateToken, validateAuthorization} = require('../middleware/jwt_handler');

const labelController = require('../controller/label_controller');

router.get('/pending', validateToken, validateAuthorization(1), labelController.getPendingTracks);
router.get('/available', validateToken, validateAuthorization(1), labelController.getAvailableTracks);
router.get('/rejected', validateToken, validateAuthorization(1), labelController.getRejectedTracks);
router.get('/queued', validateToken, validateAuthorization(1), labelController.getQueuedTracks);
router.get('/views', validateToken, validateAuthorization(1), labelController.getLabelViewsLast6Months);
router.get('/get', validateToken, validateAuthorization(3), labelController.getAllLabels);
router.get('/requests/:status', validateToken, validateAuthorization(1), labelController.getAllRequests);
router.post('/approve/:request', validateToken, validateAuthorization(1), labelController.sendApprovalEmail);
router.post('/reject/:request', validateToken, validateAuthorization(1), labelController.sendRejectionEmail);
router.get('/statistics', validateToken, validateAuthorization(1), labelController.getLabelRequestStatistics);
router.get('/document/:file', labelController.serveDocument);

module.exports = router;