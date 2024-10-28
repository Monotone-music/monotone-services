const mongoose = require('mongoose');
const option = require('./option');

const recordingSchema = new mongoose.Schema({
  title: {type: String},
  duration: {type: Number},
  metadata: {type: mongoose.Schema.Types.ObjectId, ref: 'metadata'},
  releaseGroup: {type: mongoose.Schema.Types.ObjectId, ref: 'releaseGroup'},
}, option);

module.exports = mongoose.model('recording', recordingSchema);