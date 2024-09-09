const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: {type: String, required: true},
    genre: [{type: String}],
    bio: {type: String},
    albums: [{type: mongoose.Schema.Types.ObjectId, ref: 'album'}],
    imageUrl: {type: String},
    debutDate: {type: Date},
    website: {type: String}
});

module.exports = mongoose.model('artist', artistSchema);