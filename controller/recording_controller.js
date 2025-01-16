const asyncHandler = require('../middleware/async_handler');
const RecordingService = require("../services/recording_service");

class RecordingController {
  constructor() {
    this.recordingService = new RecordingService();
  }

  getPendingRecordings = asyncHandler(async (req, res) => {
    const recordings = await this.recordingService.getPendingRecordings();
    res.status(200).json({status: 'ok', message: 'Pending recordings retrieved', data: recordings});
  });

  approveRecording = asyncHandler(async (req, res) => {
    const recordingId = req.params.id;

    const recording = await this.recordingService.approveRecording(recordingId);
    res.status(200).json({status: 'ok', message: 'Recording updated', data: recording});
  });

  approveQueuedRecording = asyncHandler(async (req, res) => {
    const recordingId = req.params.id;

    const recording = await this.recordingService.approveQueuedRecording(recordingId);
    res.status(200).json({status: 'ok', message: 'Recording updated', data: recording});
  });

  countUnavailableRecordings = asyncHandler(async (req, res) => {
    const count = await this.recordingService.countUnavailableRecordings();
    res.status(200).json({status: 'ok', message: 'Unavailable recordings count retrieved', data: {count}});
  });

  rejectRecording = asyncHandler(async (req, res) => {
    const recordingId = req.params.id;

    const recording = await this.recordingService.rejectRecording(recordingId);
    res.status(200).json({status: 'ok', message: 'Recording updated', data: recording});
  });

  disableRecording = asyncHandler(async (req, res) => {
    const recordingId = req.params.id;

    const recording = await this.recordingService.disableRecording(recordingId);
    res.status(200).json({status: 'ok', message: 'Recording updated', data: recording});
  });
}

module.exports = new RecordingController();