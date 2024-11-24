const ArtistService = require('../services/artist_service');

const asyncHandler = require('../middleware/async_handler');

class ArtistController {
  constructor() {
    this.artistService = new ArtistService();
  }

  getAllArtist = asyncHandler(async (req, res) => {
    const artists = await this.artistService.getAllArtists();
    res.status(200).json({status: 'ok', message: 'Artists retrieved', data: artists});
  });

  getArtistById = asyncHandler(async (req, res) => {
    const artistId = req.params.id;
    const artist = await this.artistService.getArtistById(artistId);
    if (!artist) {
      res.status(404).json({status: 'error', message: 'Artist not found'});
    } else {
      res.status(200).json({status: 'ok', message: 'Artist retrieved', data: artist});
    }
  });
}

module.exports = new ArtistController();