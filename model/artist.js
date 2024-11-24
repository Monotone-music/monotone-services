const mongoose = require('mongoose');
const option = require('./option');

const artistSchema = new mongoose.Schema({
  name: {type: String, required: true, unique: true},
  bio: {type: String},
  image: {type: mongoose.Schema.Types.ObjectId, ref: 'image'},
  releaseGroup: [{type: mongoose.Schema.Types.ObjectId, ref: 'releaseGroup'}],
  featuredIn: [{type: mongoose.Schema.Types.ObjectId, ref: 'releaseGroup'}],
}, option);

module.exports = mongoose.model('artist', artistSchema);