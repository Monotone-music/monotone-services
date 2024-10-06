const mongoose = require('mongoose');
const option = require('./option');

const trackSchema = new mongoose.Schema({
    title: {type: String, required: true},
    duration: {type: Number},
    artist: {type: mongoose.Schema.Types.ObjectId, ref: 'artist'},
    genre: [{type: String}],
}, option);

module.exports = mongoose.model('track', trackSchema);