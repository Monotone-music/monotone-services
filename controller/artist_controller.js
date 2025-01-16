const ArtistService = require('../services/artist_service');
const LabelService = require('../services/label_service');
const ArtistLabelRequestService = require('../services/artist_label_request_service');
const MediaService = require('../services/media_service');
const TokenService = require('../services/token_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");

class ArtistController {
  constructor() {
    this.artistService = new ArtistService();
    this.labelService = new LabelService();
    this.artistLabelRequestService = new ArtistLabelRequestService();
    this.tokenService = new TokenService();
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

  createArtistLinkRequest = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);

    const artistId = await this.artistService.getArtistByAccountId(accountId);

    const artistEmail = artistId.account.email;

    const labelId = req.body.labelId;
    const file = req.file;
    const filename = file.filename;

    const label = await this.labelService.getLabelById(labelId);
    const updatedArtist = await this.artistLabelRequestService.createArtistLabelRequest(artistId, label, artistEmail, filename);
    res.status(200).json({status: 'ok', message: 'Artist updated', data: updatedArtist});
  });

  getArtistRequests = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const artistId = await this.artistService.getArtistByAccountId(accountId);

    const status = req.params.status;

    const requests = await this.artistLabelRequestService.getRequestByArtistId(artistId, status);
    res.status(200).json({status: 'ok', message: 'Pending requests retrieved', data: requests});
  });

  approveArtistRequest = asyncHandler(async (req, res) => {
    const requestId = req.params.request;

    await this.artistLabelRequestService.updateRequestStatus(requestId, 'approved');

    res.status(200).json({status: 'ok', message: 'Account Linked'});
  });

  rejectArtistRequest = asyncHandler(async (req, res) => {
    const requestId = req.params.request;

    await this.artistLabelRequestService.updateRequestStatus(requestId, 'rejected');

    res.status(200).json({status: 'ok', message: 'Account Rejected'});
  });

  getArtistProfile = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const artist = await this.artistService.getArtistByAccountId(accountId);
    res.status(200).json({status: 'ok', message: 'Artist retrieved', data: artist});
  });

  getArtistRecordings = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const artistId = await this.artistService.getArtistByAccountId(accountId);

    const status = req.params.status;
    const recordings = await this.artistService.getArtistRecordings(artistId, status);
    res.status(200).json({status: 'ok', message: 'Recordings retrieved', data: recordings});
  });

  getArtistStatistics = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const artistId = await this.artistService.getArtistByAccountId(accountId);

    const statistics = await this.artistService.getArtistStatistics(artistId);
    res.status(200).json({status: 'ok', message: 'Statistics retrieved', data: statistics});
  });

  getMonthlyArtistViews = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const artistId = await this.artistService.getArtistByAccountId(accountId);

    const views = await this.artistService.getMonthlyArtistViews(artistId);
    res.status(200).json({status: 'ok', message: 'Views retrieved', data: views});
  });

  getTopTracks = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const artistId = await this.artistService.getArtistByAccountId(accountId);

    const topTracks = await this.artistService.getTopTracks(artistId);
    res.status(200).json({status: 'ok', message: 'Top tracks retrieved', data: topTracks});
  });

  getEstimatedEarnings = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const artistId = await this.artistService.getArtistByAccountId(accountId);

    const earnings = await this.artistService.getEstimatedEarnings(artistId);
    res.status(200).json({status: 'ok', message: 'Estimated earnings retrieved', data: earnings});
  });

  async #extractAccountIdFromAccessToken(req) {
    const preflightToken = req.header('Authorization')
    let accessToken;
    if (!preflightToken?.startsWith('Bearer ')) {
      throw new CustomError(401, 'Access denied. No token provided');
    } else {
      accessToken = preflightToken.split(' ')[1];
    }

    const accountId = await this.tokenService.getAccountIdFromToken(accessToken);
    return accountId;
  }
}

module.exports = new ArtistController();