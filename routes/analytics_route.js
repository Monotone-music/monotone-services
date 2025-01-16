const router = require('express').Router();

const {validateToken, validateAuthorization} = require('../middleware/jwt_handler');

const analyticsController = require('../controller/analytics_controller');

router.get('/total-views', validateToken, validateAuthorization(0), analyticsController.getTotalViews);
router.get('/historical-total-views', validateToken, validateAuthorization(0), analyticsController.getHistoricalTotalViews);
router.get('/pending/count', validateToken, validateAuthorization(0), analyticsController.getUnapprovedRecordingsAndAdvertisements);
router.get('/labels', validateToken, validateAuthorization(1), analyticsController.getLabelAnalytics);
router.get('/payments', validateToken, validateAuthorization(0), analyticsController.getPaymentAnalytics);

module.exports = router;