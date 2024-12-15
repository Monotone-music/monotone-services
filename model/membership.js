const mongoose = require('mongoose');

const option = require('./option');

const membershipSchema = new mongoose.Schema({
  type: {type: String, required: true},
  start: {type: Date, required: true},
  end: {type: Date},
  price: {type: Number, required: true},
  description: {type: String},
  quality: {type: String, required: true},
}, option);

module.exports = mongoose.model('membership', membershipSchema);