const router = require('express').Router();

const VerificationController = require('../controller/verification_controller');

const verificationController = new VerificationController();

router.get('/', verificationController.verifyAccount);

module.exports = router;