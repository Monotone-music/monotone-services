const mongoose = require('mongoose');
const REFRESH_TOKEN_AGE = process.env.REFRESH_TOKEN_AGE;

const option = require('./option');

const token = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
    required: true
  },
  refreshToken: {
    type: String,
    maxlength: 2048,
    required: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: REFRESH_TOKEN_AGE
  }
}, option);

module.exports = mongoose.model('token', token);