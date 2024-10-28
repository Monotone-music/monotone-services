const mongoose = require('mongoose');
const option = require('./option');

const releaseGroupSchema = new mongoose.Schema({
  title: {type: String, required: true},
  type: {type: String, required: true},
  artists: {
    name: {type: String},
    metadata: {type: mongoose.Schema.Types.ObjectId, ref: 'metadata'},
  },
  release: {type: mongoose.Schema.Types.ObjectId, ref: 'release'},
  metadata: {type: mongoose.Schema.Types.ObjectId, ref: 'metadata'},
}, option);

module.exports = mongoose.model('releaseGroup', releaseGroupSchema);