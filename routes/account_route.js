const router = require('express').Router();

const AccountController = require('../controller/account_controller');

router.put('/create', AccountController.createAccount);

module.exports = router;