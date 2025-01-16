const router = require('express').Router();

const PaymentController = require('../controller/payment_controller');

router.post('/create-intent', PaymentController.createIntent);
router.delete('/cancel-all-intents', PaymentController.cancelAllIntents);
router.get('/', PaymentController.listAllIntents);
router.post('/webhook', PaymentController.webhook);

module.exports = router;
