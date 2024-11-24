const router = require('express').Router();

const albumController = require('../controller/album_controller');

router.get('/', albumController.getAllAlbums);
router.get('/id/:id', albumController.getAlbumById);

module.exports = router;