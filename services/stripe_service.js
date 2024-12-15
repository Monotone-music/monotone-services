const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CustomError = require('../utils/custom_error');

const ListenerService = require('./listener_service');
const MembershipService = require('./membership_service');
const TokenService = require('./token_service');
const PaymentService = require('./payment_service');

class StripeService {
  constructor() {
    this.listenerService = new ListenerService();
    this.membershipService = new MembershipService();
    this.tokenService = new TokenService();
    this.paymentService = new PaymentService();
  }

  async createPaymentIntent(amount, currency, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
      });
      return paymentIntent;
    } catch (error) {
      throw new CustomError(500, "Error creating Payment Intent: " + error.message);
    }
  }

  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw new CustomError(500, "Error retrieving Payment Intent: " + error.message);
    }
  }

  async refundPayment(paymentIntentId, amount) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });
      return refund;
    } catch (error) {
      throw new CustomError(500, "Error refunding Payment: " + error.message);
    }
  }

  async listPaymentIntents(limit = 10) {
    try {
      const paymentIntents = await stripe.paymentIntents.list({limit});
      return paymentIntents;
    } catch (error) {
      throw new CustomError(500, "Error listing Payment Intents: " + error.message);
    }
  }

  async cancelAllIntents() {
    try {
      const paymentIntents = await stripe.paymentIntents.list({limit: 100});

      const intents = [];

      for (const intent of paymentIntents.data) {
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(intent.status)) {
          try {
            await stripe.paymentIntents.cancel(intent.id);
            console.log(`Cancelled: ${intent.id}`);
            intents.push(intent.id);
          } catch (error) {
            console.error(`Failed to cancel Payment Intent ${intent.id}:`, error.message);
          }
        } else {
          console.log(`Skipping Payment Intent ${intent.id} with status: ${intent.status}`);
        }
      }

      return intents;
    } catch (error) {
      console.error('Error fetching or canceling Payment Intents:', error.message);
      throw new CustomError(500, 'Failed to cancel payment intents');
    }
  }

  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'charge.updated':
          const updatedCharge = event.data.object;

          await this.#handleChargeUpdated(updatedCharge);

          console.log('Charge was updated:', updatedCharge.id);
          break;
        case 'payment_intent.created':
          const createdPaymentIntent = event.data.object;

          console.log('PaymentIntent was created:', createdPaymentIntent.id);
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;

          await this.#handlePaymentIntentSucceeded(paymentIntent);

          console.log('PaymentIntent was successful:', paymentIntent.id);
          break;
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          console.log('PaymentIntent failed:', failedPaymentIntent.id);
          break;
        default:
          console.log('Unhandled event type:', event.type);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error.message);
      throw new CustomError(500, 'Error handling webhook event');
    }
  }

  async #handlePaymentIntentSucceeded(paymentIntent) {
    const token = paymentIntent.metadata.token;
    const accountId = await this.tokenService.getAccountIdFromToken(token);
    const listener = await this.listenerService.getListenerByAccountId(accountId);
    const membership = await this.membershipService.createMembership('basic');

    await this.listenerService.updateListenerMembership(listener, membership._id);
  }

  async #handleChargeUpdated(updatedCharge) {
    const token = updatedCharge.metadata.token;

    const accountId = await this.tokenService.getAccountIdFromToken(token);
    const listener = await this.listenerService.getListenerByAccountId(accountId);

    const paymentData = {
      listener: listener._id,
      amount: updatedCharge.amount,
      currency: updatedCharge.currency,
      receiptUrl: updatedCharge.receipt_url,
      status: updatedCharge.status,
    }

    await this.paymentService.createPayment(paymentData);
  }
}

module.exports = StripeService;
