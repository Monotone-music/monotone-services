const mongoose = require('mongoose');
const option = require('./option');

const mediaSchema = new mongoose.Schema({
  filename: {type: String},
  originalName: {type: String},
  extension: {type: String},
  size: {type: Number},
  mimetype: {type: String},
  fingerprint: {
    duration: {type: Number},
    fingerprint: {type: String}
  },
  hash: {type: String},
}, option);

module.exports = mongoose.model('media', mediaSchema);