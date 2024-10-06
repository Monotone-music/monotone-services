const mongoose = require('mongoose');
const option = require('./option');

const dateSchema = new mongoose.Schema({
    day: {type: Number, required: true},
    month: {type: Number, required: true},
    year: {type: Number, required: true}
}, option);

module.exports = mongoose.model('date', dateSchema);