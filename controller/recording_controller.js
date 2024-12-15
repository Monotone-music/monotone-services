const asyncHandler = require('../middleware/async_handler');
const RecordingService = require("../services/recording_service");

class RecordingController {
  constructor() {
    this.recordingService = new RecordingService();
  }

  getUnavailableRecordings = asyncHandler(async (req, res) => {
    const recordings = await this.recordingService.getUnavailableRecordings();
    res.status(200).json({status: 'ok', message: 'Unavailable recordings retrieved', data: recordings});
  });

  updateRecordingAvailability = asyncHandler(async (req, res) => {
    const recordingId = req.params.id;

    const recording = await this.recordingService.updateRecordingAvailability(recordingId);
    res.status(200).json({status: 'ok', message: 'Recording updated', data: recording});
  });

  countUnavailableRecordings = asyncHandler(async (req, res) => {
    const count = await this.recordingService.countUnavailableRecordings();
    res.status(200).json({status: 'ok', message: 'Unavailable recordings count retrieved', data: {count}});
  });

  rejectRecordingAvailability = asyncHandler(async (req, res) => {
    const recordingId = req.params.id;

    const recording = await this.recordingService.rejectRecordingAvailability(recordingId);
    res.status(200).json({status: 'ok', message: 'Recording updated', data: recording});
  });
}

module.exports = new RecordingController();