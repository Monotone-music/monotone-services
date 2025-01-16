const mongoose = require('mongoose');
const option = require('./option');

const recordingSchema = new mongoose.Schema({
  title: {type: String},
  duration: {type: Number},
  position: {
    no: {type: Number},
    of: {type: Number}
  },
  artistSort: {type: String},
  displayedArtist: {type: String},
  artist: [{
    _id: {type: mongoose.Schema.Types.ObjectId, ref: 'artist'},
    name: {type: String}
  }],
  media: {type: mongoose.Schema.Types.ObjectId, ref: 'media'},
  image: {type: mongoose.Schema.Types.ObjectId, ref: 'image'},
  view: {type: Number, default: 0},
  available: {type: String, default: 'pending'},
  mbid: {type: String},
  acoustid: {type: String},
}, option);

module.exports = mongoose.model('recording', recordingSchema);