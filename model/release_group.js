const mongoose = require('mongoose');
const option = require('./option');

const releaseGroupSchema = new mongoose.Schema({
    title: {type: String, required: true},
    artist: {type: mongoose.Schema.Types.ObjectId, ref: 'artist'},
    country: {type: String},
    release_date: {type: mongoose.Schema.Types.ObjectId, ref: 'date'},
    medium: {type: mongoose.Schema.Types.ObjectId, ref: 'medium'},
    track_count: {type: Number},
    primary_type: {type: String},
}, option);

module.exports = mongoose.model('release-group', releaseGroupSchema);