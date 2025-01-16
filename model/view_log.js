const mongoose = require('mongoose');

const option = require('./option');

const viewLogSchema = new mongoose.Schema({
  recording: {type: mongoose.Schema.Types.ObjectId, ref: 'recording', required: true},
  count: {type: Number, default: 1},
}, option);

module.exports = mongoose.model('viewLog', viewLogSchema);