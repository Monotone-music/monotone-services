const ReleaseGroupService = require('../services/release_group_service');

const asyncHandler = require('../middleware/async_handler');

class AlbumController {
  constructor() {
    this.releaseGroupService = new ReleaseGroupService();
  }

  getAllAlbums = asyncHandler(async (req, res) => {
    const albums = await this.releaseGroupService.getAllReleaseGroups();
    res.status(200).json({status: 'ok', message: 'Albums retrieved', data: albums});
  });

  getAlbumById = asyncHandler(async (req, res) => {
    const albumId = req.params.id;
    const album = await this.releaseGroupService.getReleaseGroupByID(albumId);
    res.status(200).json({status: 'ok', message: 'Album retrieved', data: album});
  });
}

module.exports = new AlbumController();