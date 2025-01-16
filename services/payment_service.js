const Payment = require('../model/payment');
const CustomError = require("../utils/custom_error");

class PaymentService {
  constructor() {
  }

  createPayment(paymentData, flag) {
    const paymentObject = {
      amount: paymentData.amount,
      currency: paymentData.currency,
      receiptUrl: paymentData.receiptUrl,
      status: paymentData.status,
    };

    switch (flag) {
      case 'listener':
        paymentObject.listener = paymentData.listener;
        break;
      case 'advertiser':
        paymentObject.advertiser = paymentData.advertiser;
        break;
      default:
        throw new CustomError(400, 'Invalid flag');
    }

    const payment = new Payment(paymentObject);

    return payment.save();
  }

  async getAllPayments() {
    const payments = await Payment.aggregate([
      {
        $lookup: {
          from: 'advertisers',
          localField: 'advertiser',
          foreignField: '_id',
          as: 'advertiser',
          pipeline: [
            {
              $project: {
                displayName: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'listeners',
          localField: 'listener',
          foreignField: '_id',
          as: 'listener',
          pipeline: [
            {
              $project: {
                displayName: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$advertiser',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$listener',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          amount: {$divide: ["$amount", 100]},
          currency: 1,
          receiptUrl: 1,
          status: 1,
          advertiser: "$advertiser.displayName",
          listener: "$listener.displayName",
          createdAt: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    const advertiserPayments = payments.filter(payment => payment.advertiser);
    const listenerPayments = payments.filter(payment => payment.listener);

    return {
      advertiserPayments,
      listenerPayments
    };
  }
}

module.exports = PaymentService;