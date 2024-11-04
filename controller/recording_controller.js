const Stream = require('stream');
const asyncHandler = require('../middleware/async_handler');
const RecordingService = require("../services/recording_service");

class RecordingController {
  constructor() {
    this.recordingService = new RecordingService();
  }

  putRecording = asyncHandler(async (req, res) => {
    const {buffer, ext} = req.file;
    await this.recordingService.putRecording(buffer, ext);
    res.status(200).json({status: 'ok', message: 'Recording uploaded'});
  });
}

module.exports = new RecordingController();