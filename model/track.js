const mongoose = require('mongoose');
const option = require('./option');

const trackSchema = new mongoose.Schema({
  artists: {
    name: {type: String},
    metadata: {type: mongoose.Schema.Types.ObjectId, ref: 'metadata'},
  },
  metadata: {type: mongoose.Schema.Types.ObjectId, ref: 'metadata'},
  position: {type: Number},
}, option);

module.exports = mongoose.model('track', trackSchema);