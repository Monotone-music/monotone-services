const mongoose = require('mongoose');
const option = require('./option');

const mediumSchema = new mongoose.Schema({
  format: {type: String},
  position: {type: Number},
  trackCount: {type: Number},
  track: {type: mongoose.Schema.Types.ObjectId, ref: 'track'},
}, option);

module.exports = mongoose.model('medium', mediumSchema);