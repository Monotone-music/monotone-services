const mongoose = require('mongoose');
const logger = require('./logging');

module.exports = async function () {
    const db = process.env.DB_CONNECT

    try {
        await mongoose.connect(db);
        logger.info(`Connected to the Monotone Database...`);
    } catch (error) {
        logger.error(error);
    }
};