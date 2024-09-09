const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    title: {type: String, required: true},
    releaseDate: {type: Date},
    genre: [{type: String}],
    artist: {type: mongoose.Schema.Types.ObjectId, ref: 'artist'},
    imageUrl: {type: String},
    songs: [{type: mongoose.Schema.Types.ObjectId, ref: 'tracks'}]
});

module.exports = mongoose.model('album', albumSchema);