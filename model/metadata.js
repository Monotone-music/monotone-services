const mongoose = require('mongoose');
const option = require('./option');

const metadataSchema = new mongoose.Schema({
  mbid: {type: String},
  ascid: {type: String},
}, option);

module.exports = mongoose.model('metadata', metadataSchema);