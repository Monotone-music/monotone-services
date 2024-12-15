const mongoose = require('mongoose');

const option = require('./option');

const listenerSchema = new mongoose.Schema({
  account: {type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true},
  displayName: {type: String, required: true},
  membership: {type: mongoose.Schema.Types.ObjectId, ref: 'membership'},
  playlist: [{type: mongoose.Schema.Types.ObjectId, ref: 'playlist'}],
}, option);

module.exports = mongoose.model('listener', listenerSchema);