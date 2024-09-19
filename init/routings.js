const express = require('express');
const logger = require('./logging');

const tracksRouter = require('../routes/tracks_route');

function registerRoutes(app) {
    try {
        const router = express.Router();

        router.use('/tracks', tracksRouter);

        app.use('', router);
        logger.info('Routes registered');
    } catch (error) {
        logger.error('Error registering routes:', error);
    }
}

module.exports = registerRoutes;