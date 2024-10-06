const mongoose = require('mongoose');
const option = require('./option');

const mediumSchema = new mongoose.Schema({
    format: {type: String},
    position: {type: Number},
    track_count: {type: Number},
    track: [{
        track_id: {type: mongoose.Schema.Types.ObjectId, ref: 'track'},
        position: {type: Number},
    }]
}, option);

module.exports = mongoose.model('medium', mediumSchema);