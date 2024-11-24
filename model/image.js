const mongoose = require('mongoose');
const option = require('./option');

const imageSchema = new mongoose.Schema({
  type: {type: String},
  filename: {type: String},
  mimetype: {type: String},
  size: {type: Number},
  url: {type: String},
  hash: {type: String},
  dimensions: {
    width: {type: Number},
    height: {type: Number}
  }
}, option);

module.exports = mongoose.model('image', imageSchema);