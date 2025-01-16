const mongoose = require('mongoose');

const option = require('./option');

const adBundleSchema = new mongoose.Schema({
  name: {type: String, required: true, default: 'Ad Bundle'},
  description: {type: String, required: true, default: 'Default Ad Bundle'},
  quota: {type: Number, required: true, default: 0},
  price: {type: Number, required: true, default: 0},
  status: {type: String, default: 'active'},
}, option);

module.exports = mongoose.model('adBundle', adBundleSchema);