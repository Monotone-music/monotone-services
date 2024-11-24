const mongoose = require('mongoose');
const option = require('./option');

const releaseSchema = new mongoose.Schema({
  title: {type: String, required: true},
  status: {type: String, required: true},
  format: {type: String},
  trackCount: {type: Number},
  recording: [{type: mongoose.Schema.Types.ObjectId, ref: 'recording', unique: true}],
  mbid: {type: String, unique: true},
}, option);

module.exports = mongoose.model('release', releaseSchema);
