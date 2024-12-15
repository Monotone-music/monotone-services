const router = require('express').Router();

const albumController = require('../controller/album_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.get('/', validateToken, albumController.getAllAlbums);
router.get('/id/:id', validateToken, albumController.getAlbumById);
router.get('/top', validateToken, albumController.getTopAlbums);
router.get('/count', validateToken, albumController.getAlbumCount);

module.exports = router;