const mongoose = require('mongoose');

const option = require('./option');

const adViewLogSchema = new mongoose.Schema({
  advertisement: {type: mongoose.Schema.Types.ObjectId, ref: 'advertisement'},
  count: {type: Number, default: 1},
}, option);

module.exports = mongoose.model('adViewLog', adViewLogSchema);