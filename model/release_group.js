const mongoose = require('mongoose');
const option = require('./option');

const releaseGroupSchema = new mongoose.Schema({
  title: {type: String, required: true},
  releaseType: {type: String, required: true},
  releaseEvent: {
    date: {type: Date},
    country: {type: String}
  },
  albumArtist: {type: String},
  release: [{type: mongoose.Schema.Types.ObjectId, ref: 'release'}],
  image: {type: mongoose.Schema.Types.ObjectId, ref: 'image'},
  mbid: {type: String, unique: true},
}, option);

module.exports = mongoose.model('releaseGroup', releaseGroupSchema);