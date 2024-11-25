const router = require('express').Router();

const imageController = require('../controller/image_controller');

router.get('/:imageId', imageController.getImage);

module.exports = router;