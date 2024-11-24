const asyncHandler = require('../middleware/async_handler');
const RecordingService = require("../services/recording_service");

class RecordingController {
  constructor() {
    this.recordingService = new RecordingService();
  }
}

module.exports = new RecordingController();