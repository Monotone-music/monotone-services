const PlaylistService = require('../services/playlist_service');
const TokenService = require('../services/token_service');
const ListenerService = require('../services/listener_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");

class PlaylistController {
  constructor() {
    this.playlistService = new PlaylistService();
    this.tokenService = new TokenService();
    this.listenerService = new ListenerService();
  }

  createPlaylist = asyncHandler(async (req, res) => {
    const name = req.body.name;
    const recordingId = req.body.recordingId;

    let playlist = await this.playlistService.createPlaylist(name);

    if (recordingId) {
      playlist = await this.playlistService.addRecordingToPlaylist(playlist._id, recordingId);
    }

    const accountid = await this.#extractAccountIdFromAccessToken(req);

    const listener = await this.listenerService.getListenerByAccountId(accountid);

    await this.listenerService.insertPlaylist(listener._id, playlist._id);

    res.status(200).json({status: 'ok', message: 'Playlist created', data: {playlist: playlist}});
  });

  getPlaylistById = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId;

    const accountId = await this.#extractAccountIdFromAccessToken(req);
    await this.#verifyPlaylistOwnership(playlistId, accountId);

    const playlist = await this.playlistService.getPlaylistById(playlistId);
    res.status(200).json({status: 'ok', message: 'Playlist retrieved', data: {playlist: playlist}});
  });

  addRecordingToPlaylist = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId;
    const recordingId = req.body.recordingId;

    const accountId = await this.#extractAccountIdFromAccessToken(req);
    await this.#verifyPlaylistOwnership(playlistId, accountId);

    const playlist = await this.playlistService.addRecordingToPlaylist(playlistId, recordingId);
    res.status(200).json({status: 'ok', message: 'Recording added to playlist', data: {playlist: playlist}});
  });

  removeRecordingFromPlaylist = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId;
    const index = req.body.index;

    const accountId = await this.#extractAccountIdFromAccessToken(req);
    await this.#verifyPlaylistOwnership(playlistId, accountId);

    const playlist = await this.playlistService.removeRecordingFromPlaylist(playlistId, index);
    res.status(200).json({status: 'ok', message: 'Recording removed from playlist', data: {playlist: playlist}});
  });

  updatePlaylist = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId;
    const name = req.body.name;

    const accountId = await this.#extractAccountIdFromAccessToken(req);
    await this.#verifyPlaylistOwnership(playlistId, accountId);

    const playlist = await this.playlistService.updatePlaylist(playlistId, name);
    res.status(200).json({status: 'ok', message: 'Playlist updated', data: {playlist: playlist}});
  });

  deletePlaylist = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId;

    const accountId = await this.#extractAccountIdFromAccessToken(req);
    await this.#verifyPlaylistOwnership(playlistId, accountId);

    await this.playlistService.deletePlaylist(playlistId, accountId);
    res.status(200).json({status: 'ok', message: 'Playlist deleted'});
  });

  async #verifyPlaylistOwnership(playlistId, accountId) {
    const playlist = await this.playlistService.getPlaylistById(playlistId);
    if (!playlist) {
      throw new CustomError(404, 'Playlist not found.');
    }

    const listener = await this.listenerService.getListenerByAccountId(accountId);
    if (!listener) {
      throw new CustomError(404, 'Listener not found.');
    }

    const playlistIds = listener.playlist.map(({id}) => id);
    const currentPlaylistId = playlist._id;

    if (!playlistIds.includes(currentPlaylistId.toString())) {
      throw new CustomError(403, 'Access denied. Playlist does not belong to the user.');
    }
  }

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

module.exports = new PlaylistController();