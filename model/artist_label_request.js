const mongoose = require('mongoose');
const option = require('./option');

const artistLabelRequestSchema = new mongoose.Schema({
  artistId: {type: mongoose.Schema.Types.ObjectId, ref: 'artist'},
  labelId: {type: mongoose.Schema.Types.ObjectId, ref: 'label'},
  artistEmail: {type: String},
  file: {type: String},
  status: {type: String, enum: ['pending', 'approved', 'rejected', 'noticed'], default: 'pending'},
}, option);

module.exports = mongoose.model('artistLabelRequest', artistLabelRequestSchema);