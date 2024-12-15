const mongoose = require('mongoose');

const option = require('./option');

const playlistSchema = new mongoose.Schema({
  name: {type: String, required: true},
  recording: [
    {
      recording: {type: mongoose.Schema.Types.ObjectId, ref: 'recording', required: true},
      index: {type: Number, required: true}, // Add index field
    },
  ],
  image: {type: mongoose.Schema.Types.ObjectId, ref: 'image'},
}, option);

module.exports = mongoose.model('playlist', playlistSchema);