const TracksService = require("../services/tracks_service");
const TokenService = require("../services/token_service");
const ArtistService = require("../services/artist_service");
const LabelService = require("../services/label_service");

const CustomError = require("../utils/custom_error");
const asyncHandler = require('../middleware/async_handler');

class TracksController {
  constructor() {
    this.trackService = new TracksService();
    this.tokenService = new TokenService();
    this.artistService = new ArtistService();
    this.labelService = new LabelService();
  }

  parseTrack = asyncHandler(async (req, res) => {
    const files = req.files || req.file;

    let flag = req.query.flag || 'label';

    let accountId = await this.#extractAccountIdFromAccessToken(req);

    let artist, artistLabel, artistLabelId, label, labelAccountId;
    if (flag === 'artist') {
      artist = await this.artistService.getArtistByAccountId(accountId);
      artistLabel = artist.labelId.displayName;
      artistLabelId = artist.labelId._id;
    }

    if (artistLabel === 'defaultlabel') {
      flag = 'label';
      label = await this.labelService.getLabelById(artistLabelId);
      labelAccountId = label.account;
      accountId = labelAccountId;
    }

    const result = await this.trackService.parseTrackMetadata(files, accountId, flag);
    res.status(200).json({status: 'ok', message: 'Recording uploaded', data: result});
  });

  getTrackStream = asyncHandler(async (req, res) => {
    try {
      const recordingId = req.params.recordingId;
      const bitrate = req.query.bitrate;

      const CHUNK_SIZE = 1024 * 1024;

      const {range} = req.headers;

      const file = await this.trackService.getTrackStream(recordingId, bitrate);

      if (range) {
        const [start, end] = range.replace(/bytes=/, '').split('-');
        const startByte = parseInt(start, 10);
        const endByte = end ? parseInt(end, 10) : Math.min(startByte + CHUNK_SIZE - 1, file.fileSize - 1);
        const chunkSize = endByte - startByte + 1;

        res.setHeader('Content-Range', `bytes ${startByte}-${endByte}/${file.fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunkSize);
        res.setHeader('Content-Type', file.mimetype);

        return res.status(206).send(file.buffer.subarray(startByte, endByte + 1));
      }

      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Length', file.fileSize);
      res.setHeader('Accept-Ranges', 'bytes');
      res.status(200).send(file.buffer);
    } catch (error) {
      res.status(500).json({status: 'error', message: 'Failed to retrieve track', error: error.message});
    }
  });

  getMobileTrackStream = asyncHandler(async (req, res) => {
    try {
      const recordingId = req.params.recordingId;
      const bitrate = req.query.bitrate;
      const CHUNK_SIZE = 1024 * 1024;

      const file = await this.trackService.getTrackStream(recordingId, bitrate);

      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', file.mimetype);

      const range = req.headers.range || `bytes=0-${CHUNK_SIZE}`;

      const positions = range.replace(/bytes=/, '').split('-');

      const start = parseInt(positions[0], 10);
      const end = positions[1]
        ? parseInt(positions[1], 10)
        : Math.min(start + CHUNK_SIZE, file.fileSize - 1);

      const contentLength = end - start + 1;

      if (start >= file.fileSize || end >= file.fileSize) {
        res.setHeader('Content-Range', `bytes */${file.fileSize}`);
        return res.status(416).send('Requested range not satisfiable');
      }

      res.setHeader('Content-Range', `bytes ${start}-${end}/${file.fileSize}`);
      res.setHeader('Content-Length', contentLength);
      res.setHeader('Cache-Control', 'no-store');

      res.status(206);

      const chunk = file.buffer.subarray(start, end + 1);
      res.write(chunk);
      res.end();

    } catch (error) {
      console.error('Streaming error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to stream track',
        error: error.message
      });
    }
  });

  getTopTracks = asyncHandler(async (req, res) => {
    const limit = req.query.limit;
    const tracks = await this.trackService.getTopTracks(limit);
    res.status(200).json({status: 'ok', message: 'Top tracks retrieved', data: tracks});
  });

  getTracksCount = asyncHandler(async (req, res) => {
    const count = await this.trackService.getTracksCount();
    res.status(200).json({status: 'ok', message: 'Tracks count retrieved', data: {count: count}});
  });

  getTracksGeneralInfo = asyncHandler(async (req, res) => {
    const recordingId = req.params.recordingId;

    const track = await this.trackService.getTracksGeneralInfo(recordingId);

    res.status(200).json({status: 'ok', message: 'Track general info retrieved', data: track});
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

module.exports = new TracksController();