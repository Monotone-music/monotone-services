const mongoose = require('mongoose');

const option = require('./option');

const accessLevelSchema = new mongoose.Schema({
  name: {type: String, required: true},
  privilege: {type: String, required: true},
  accessLevel: {type: Number, required: true},
}, option);

module.exports = mongoose.model('accessLevel', accessLevelSchema);