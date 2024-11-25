const router = require('express').Router();

const artistController = require('../controller/artist_controller');

router.get('/', artistController.getAllArtist);
router.get('/id/:id', artistController.getArtistById);

module.exports = router;