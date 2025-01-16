const mongoose = require('mongoose');
const {v4: uuidv4} = require('uuid');

const option = require('./option');

const verificationTokenSchema = new mongoose.Schema({
  token: {type: String, default: uuidv4},
  account: {type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true},
  createdAt: {type: Date, default: Date.now, expires: 3600},
}, option);

module.exports = mongoose.model('verificationToken', verificationTokenSchema);