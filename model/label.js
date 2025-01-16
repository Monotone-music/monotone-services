const mongoose = require('mongoose');

const option = require('./option');

const labelSchema = new mongoose.Schema({
  displayName: {type: String, required: true},
  email: {type: String, required: true},
  account: {type: mongoose.Schema.Types.ObjectId, ref: 'account'},
  image: {type: mongoose.Schema.Types.ObjectId, ref: 'image'},
  releaseGroup: [{type: mongoose.Schema.Types.ObjectId, ref: 'releaseGroup'}],
}, option);

module.exports = mongoose.model('label', labelSchema);