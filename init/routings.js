const express = require('express');
const logger = require('./logging');

function registerRoutes(app) {
  try {
    const router = express.Router();

    router.use('/tracks', require('../routes/tracks_route'));
    router.use('/recording', require('../routes/recording_route'));
    router.use('/album', require('../routes/album_route'));
    router.use('/image', require('../routes/image_route'));
    router.use('/artist', require('../routes/artist_route'));
    router.use('/search', require('../routes/search_route'));
    router.use('/account', require('../routes/account_route'));
    router.use('/auth', require('../routes/auth_route'));
    router.use('/payment', require('../routes/payment_route'));
    router.use('/listener', require('../routes/listener_route'));
    router.use('/playlist', require('../routes/playlist_route'));
    router.use('/analytics', require('../routes/analytics_route'));
    router.use('/advertisement', require('../routes/advertisement_route'));
    router.use('/advertiser', require('../routes/advertiser_route'));
    router.use('/access_level', require('../routes/access_level_route'));
    router.use('/label', require('../routes/label_route'));
    router.use('/verification', require('../routes/verification_route'));

    app.use('', router);
    logger.info('Routes registered');
  } catch (error) {
    logger.error('Error registering routes:', error);
  }
}

module.exports = registerRoutes;