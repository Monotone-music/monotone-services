const router = require('express').Router();

const artistController = require('../controller/artist_controller');

const {validateToken} = require('../middleware/jwt_handler');
const {uploadSingleDocument} = require('../middleware/document_parser');

router.get('/', validateToken, artistController.getAllArtist);
router.get('/id/:id', validateToken, artistController.getArtistById);
router.post('/link/', validateToken, uploadSingleDocument, artistController.createArtistLinkRequest);
router.get('/requests/:status', validateToken, artistController.getArtistRequests);
router.get('/profile', validateToken, artistController.getArtistProfile);
router.get('/recording/:status', validateToken, artistController.getArtistRecordings);
router.get('/statistics', validateToken, artistController.getArtistStatistics);
router.get('/views', validateToken, artistController.getMonthlyArtistViews);
router.get('/top', validateToken, artistController.getTopTracks);
router.get('/earnings', validateToken, artistController.getEstimatedEarnings);

module.exports = router;