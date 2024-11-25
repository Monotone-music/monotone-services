const asyncHandler = require('../middleware/async_handler');
const TracksService = require("../services/tracks_service");

class TracksController {
  constructor() {
    this.trackService = new TracksService();
  }

  parseTrack = asyncHandler(async (req, res) => {
    const files = req.files || req.file;
    const result = await this.trackService.parseTrackMetadata(files);
    res.status(200).json({status: 'ok', message: 'Recording uploaded', data: result});
  });

  // getTrackStream = asyncHandler(async (req, res) => {
  //   try {
  //     const recordingId = req.params.recordingId;
  //     const bitrate = req.query.bitrate;
  //
  //     const {range} = req.headers;
  //     const file = await this.trackService.getTrackStream(recordingId, bitrate);
  //
  //     if (range) {
  //       const [start, end] = range.replace(/bytes=/, '').split('-');
  //       const startByte = parseInt(start, 10);
  //       const endByte = end ? parseInt(end, 10) : file.fileSize - 1;
  //       const chunkSize = endByte - startByte + 1;
  //
  //       res.setHeader('Content-Range', `bytes ${startByte}-${endByte}/${file.fileSize}`);
  //       res.setHeader('Accept-Ranges', 'bytes');
  //       res.setHeader('Content-Length', chunkSize);
  //       res.setHeader('Content-Type', file.mimetype);
  //
  //       return res.status(206).send(file.buffer.subarray(startByte, endByte + 1));
  //     }
  //
  //     res.setHeader('Content-Type', file.mimetype);
  //     res.setHeader('Content-Length', file.fileSize);
  //     res.status(200).send(file.buffer);
  //   } catch (error) {
  //     res.status(500).json({status: 'error', message: 'Failed to retrieve test track', error: error.message});
  //   }
  // });

  getTrackStream = asyncHandler(async (req, res) => {
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
}

module.exports = new TracksController();