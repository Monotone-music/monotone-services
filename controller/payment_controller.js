const StripeService = require('../services/stripe_service');

const asyncHandler = require('../middleware/async_handler');

class PaymentController {
  constructor() {
    this.stripeService = new StripeService();
  }

  createIntent = asyncHandler(async (req, res) => {
    const {amount, currency, metadata} = req.body;
    const paymentIntent = await this.stripeService.createPaymentIntent(amount, currency, metadata);
    res.status(200).json({status: 'ok', message: 'Payment Intent created', data: {intent: paymentIntent}});
  });

  cancelAllIntents = asyncHandler(async (req, res) => {
    const results = await this.stripeService.cancelAllIntents();
    res.status(200).json({status: 'ok', message: 'All Payment Intents cancelled', data: results});
  });

  listAllIntents = asyncHandler(async (req, res) => {
    const results = await this.stripeService.listPaymentIntents();
    res.status(200).json({status: 'ok', message: 'All Payment Intents listed', data: {intents: results.data}});
  });

  webhook = asyncHandler(async (req, res) => {
    const event = req.body;
    await this.stripeService.handleWebhook(event);
    res.status(200).json({status: 'ok', message: 'Webhook received'});
  });
}

module.exports = new PaymentController();