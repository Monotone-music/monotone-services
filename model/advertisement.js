const mongoose = require('mongoose');

const option = require('./option');

const advertisementSchema = new mongoose.Schema({
  title: {type: String, required: true},
  media: {type: mongoose.Schema.Types.ObjectId, ref: 'media'},
  image: {type: mongoose.Schema.Types.ObjectId, ref: 'image'},
  type: {type: String, required: true},
  status: {type: String, default: 'pending'},
  view: {type: Number, default: 0},
}, option);

module.exports = mongoose.model('advertisement', advertisementSchema);