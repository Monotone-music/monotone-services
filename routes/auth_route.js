const router = require('express').Router();

const AuthController = require('../controller/auth_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.post('/login', AuthController.login);
router.post('/logout', validateToken, AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.post('/keep-alive', validateToken, AuthController.keepAlive);
router.get('/test', validateToken, AuthController.test);

module.exports = router;