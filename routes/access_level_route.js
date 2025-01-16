const router = require('express').Router();

const AccessLevelController = require('../controller/access_level_controller');

router.put('/create', AccessLevelController.createAccessLevel);

module.exports = router;