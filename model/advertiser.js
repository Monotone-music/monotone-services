const mongoose = require('mongoose');

const option = require('./option');

const advertiserSchema = new mongoose.Schema({
  displayName: {type: String, required: true},
  email: {type: String, required: true},
  account: {type: mongoose.Schema.Types.ObjectId, ref: 'account'},
  adBundle: {type: mongoose.Schema.Types.ObjectId, ref: 'adBundle'},
  advertisement: [{type: mongoose.Schema.Types.ObjectId, ref: 'advertisement'}],
}, option);

module.exports = mongoose.model('advertiser', advertiserSchema);