const router = require('express').Router();

const PlaylistController = require('../controller/playlist_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.put('/', validateToken, PlaylistController.createPlaylist);
router.get('/:playlistId', validateToken, PlaylistController.getPlaylistById);
router.put('/:playlistId', validateToken, PlaylistController.addRecordingToPlaylist);
router.delete('/:playlistId/recording', validateToken, PlaylistController.removeRecordingFromPlaylist);
router.patch('/:playlistId', validateToken, PlaylistController.updatePlaylist);
router.delete('/:playlistId', validateToken, PlaylistController.deletePlaylist);

module.exports = router;