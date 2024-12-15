const router = require('express').Router();

const {validateToken} = require('../middleware/jwt_handler');

const analyticsController = require('../controller/analytics_controller');

router.get('/total-views', validateToken, analyticsController.getTotalViews);
router.get('/historical-total-views', validateToken, analyticsController.getHistoricalTotalViews);

module.exports = router;