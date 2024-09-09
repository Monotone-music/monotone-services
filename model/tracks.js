const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
    title: {type: String, required: true},
    duration: {type: Number},
    artist: {type: mongoose.Schema.Types.ObjectId, ref: 'artist'},
    album: {type: mongoose.Schema.Types.ObjectId, ref: 'album'},
    genre: [{type: String}],
    lyrics: {type: String},
    imageUrl: {type: String}
});

module.exports = mongoose.model('track', trackSchema);