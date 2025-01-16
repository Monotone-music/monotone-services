const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CustomError = require('../utils/custom_error');

const ListenerService = require('./listener_service');
const MembershipService = require('./membership_service');
const TokenService = require('./token_service');
const PaymentService = require('./payment_service');
const AdvertiserService = require('./advertiser_service');
const AdBundleService = require('./ad_bundle_service');
const AccountService = require('./account_service');

const {sendEmail} = require('./email_service');

class StripeService {
  constructor() {
    this.listenerService = new ListenerService();
    this.membershipService = new MembershipService();
    this.tokenService = new TokenService();
    this.paymentService = new PaymentService();
    this.advertiserService = new AdvertiserService();
    this.adBundleService = new AdBundleService();
    this.accountService = new AccountService();
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

          await this.#handleMetadata(event);

          console.log('Charge was updated:', updatedCharge.id);
          break;
        case 'payment_intent.created':
          const createdPaymentIntent = event.data.object;

          console.log('PaymentIntent was created:', createdPaymentIntent.id);
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

  async #handleMetadata(stripeEvent) {
    const metadata = stripeEvent.data.object.metadata;

    switch (metadata.type) {
      case 'membership':
        await this.#handleChargeUpdateForListeners(stripeEvent.data.object);
        break;
      case 'quota':
        await this.#handleChargeUpdateForAdvertisersQuota(stripeEvent.data.object);
        break;
      default:
        throw new CustomError(400, 'Invalid metadata type');
    }
  }

  async #handlePaymentIntentSucceededForListener(paymentIntent) {
    const token = paymentIntent.metadata.token;
    const accountId = await this.tokenService.getAccountIdFromToken(token);
    const listener = await this.listenerService.getListenerByAccountId(accountId);
    const membership = await this.membershipService.createMembership('basic');

    await this.listenerService.updateListenerMembership(listener, membership._id);
  }

  async #handleChargeUpdateForListeners(updatedCharge) {
    const token = updatedCharge.metadata.token;

    const accountId = await this.tokenService.getAccountIdFromToken(token);
    const listener = await this.listenerService.getListenerByAccountId(accountId);

    await this.#handlePaymentIntentSucceededForListener(updatedCharge);

    const accountEmail = await this.accountService.getAccountEmailFromAccountId(accountId);

    const paymentData = {
      listener: listener._id,
      amount: updatedCharge.amount,
      currency: updatedCharge.currency,
      receiptUrl: updatedCharge.receipt_url,
      status: updatedCharge.status,
    }

    await sendEmail(accountEmail, accountId, 'payment', paymentData);

    await this.paymentService.createPayment(paymentData, 'listener');
  }

  async #handleChargeUpdateForAdvertisersQuota(updatedCharge) {
    const token = updatedCharge.metadata.token;

    const accountId = await this.tokenService.getAccountIdFromToken(token);
    const advertiser = await this.advertiserService.getAdvertiserByAccountId(accountId);

    const adBundle = await this.adBundleService.getAdBundleById(advertiser.adBundle._id);

    await this.adBundleService.increaseQuota(adBundle._id, updatedCharge.amount / 5);

    const accountEmail = await this.accountService.getAccountEmailFromAccountId(accountId);

    const paymentData = {
      advertiser: advertiser._id,
      amount: updatedCharge.amount,
      currency: updatedCharge.currency,
      receiptUrl: updatedCharge.receipt_url,
      status: updatedCharge.status,
    }

    await sendEmail(accountEmail, accountId, 'payment', paymentData);

    await this.paymentService.createPayment(paymentData, 'advertiser');
  }
}

module.exports = StripeService;
