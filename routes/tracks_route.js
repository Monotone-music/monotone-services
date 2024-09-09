const trackController = require('../controller/tracks_controller');

module.exports = function (fastify, opts, done) {
    fastify.get('/tracks', (req, reply) => trackController.getTracks(req, reply));
    fastify.get('/get', (req, reply) => trackController.streamTrack(req, reply));
    done();
}