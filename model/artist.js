const mongoose = require('mongoose');
const option = require('./option');

const artistSchema = new mongoose.Schema({
    name: {type: String, required: true},
    genre: [{type: String}],
    bio: {type: String},
    album: [{type: mongoose.Schema.Types.ObjectId, ref: 'album'}],
    track: [{type: mongoose.Schema.Types.ObjectId, ref: 'track'}],
}, option);

module.exports = mongoose.model('artist', artistSchema);