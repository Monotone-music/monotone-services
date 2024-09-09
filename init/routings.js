const fastify = require('fastify')({
    logger: false
});
const logger = require('./logging');

const tracksRouter = require('../routes/tracks_route');

function registerRoutes(fastify) {
    try {
        fastify.register(tracksRouter);
        logger.info('Routes registered');
    } catch (error) {
        logger.error(error);
    }
}

module.exports = registerRoutes;
