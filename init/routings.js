const express = require('express');
const logger = require('./logging');

const tracksRouter = require('../routes/tracks_route')
const recordingRouter = require('../routes/recording_route')

function registerRoutes(app) {
    try {
        const router = express.Router();

        router.use('/tracks', tracksRouter);
        router.use('/recording', recordingRouter);

        app.use('', router);
        logger.info('Routes registered');
    } catch (error) {
        logger.error('Error registering routes:', error);
    }
}

module.exports = registerRoutes;