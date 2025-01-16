const router = require('express').Router();

const advertiserController = require('../controller/advertiser_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.get('/profile', validateToken, advertiserController.getAdvertiserById);
router.patch('/update', validateToken, advertiserController.updateAdvertiserWithAdBundle);
router.get('/get', validateToken, advertiserController.getRandomAdvertiser);
router.get('/top', validateToken, advertiserController.getTop5Advertisements);
router.get('/statistics', validateToken, advertiserController.getAdvertiserStatistics);
router.get('/active', validateToken, advertiserController.getActiveAdvertisements);
router.get('/pending', validateToken, advertiserController.getPendingAdvertisements);
router.get('/rejected', validateToken, advertiserController.getRejectedAdvertisements);
router.get('/graph', validateToken, advertiserController.getAdViewLogsPast6Months);

module.exports = router;