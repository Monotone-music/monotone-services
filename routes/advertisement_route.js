const router = require('express').Router();

const advertisementController = require('../controller/advertisement_controller');

const {uploadFields} = require('../middleware/file_parser')
const {validateToken} = require('../middleware/jwt_handler');

router.put('/create', validateToken, uploadFields, advertisementController.createAdvertisement);
router.get('/detail/:id', advertisementController.getAdvertisement);
router.get('/stream/:id', advertisementController.getAdvertisementStream);
router.get('/random', advertisementController.getRandomPlayerAdFromWeightedAdvertiser);
router.get('/pending', advertisementController.getPendingAdvertisements);
router.patch('/approve/:id', validateToken, advertisementController.approveAdvertisement);
router.patch('/reject/:id', validateToken, advertisementController.rejectAdvertisement);
router.patch('/disable/:id', validateToken, advertisementController.disableAdvertisement);

module.exports = router;