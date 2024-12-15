const router = require('express').Router();

const artistController = require('../controller/artist_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.get('/', validateToken, artistController.getAllArtist);
router.get('/id/:id', validateToken, artistController.getArtistById);

module.exports = router;