const mongoose = require('mongoose');
const option = require('./option');

const releaseSchema = new mongoose.Schema({
  country: {type: String},
  date: {
    day: {type: Number},
    month: {type: Number},
    year: {type: Number}
  },
  metadata: {type: mongoose.Schema.Types.ObjectId, ref: 'metadata'},
  medium_count: {type: Number},
  medium: {type: mongoose.Schema.Types.ObjectId, ref: 'medium'},
  releaseEvent: {
    country: {type: String},
    date: {
      day: {type: Number},
      month: {type: Number},
      year: {type: Number}
    }
  },
  trackCount: {type: Number}
}, option);

module.exports = mongoose.model('release', releaseSchema);