const router = require('express').Router();

const ListenerController = require('../controller/listener_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.get('/profile', validateToken, ListenerController.getListenerProfile);

module.exports = router;