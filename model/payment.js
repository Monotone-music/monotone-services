const mongoose = require('mongoose');

const option = require('./option');

const paymentSchema = new mongoose.Schema({
  listener: {type: mongoose.Schema.Types.ObjectId, ref: 'listener', required: true},
  amount: {type: Number, required: true},
  currency: {type: String, required: true},
  receiptUrl: {type: String, required: true},
  status: {type: String, required: true},
}, option);

module.exports = mongoose.model('payment', paymentSchema);