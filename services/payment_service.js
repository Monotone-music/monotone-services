const Payment = require('../model/payment');

class PaymentService {
  constructor() {
  }

  createPayment(paymentData) {
    const payment = new Payment({
      listener: paymentData.listener,
      amount: paymentData.amount,
      currency: paymentData.currency,
      receiptUrl: paymentData.receiptUrl,
      status: paymentData.status,
    });
    return payment.save();
  }
}

module.exports = PaymentService;