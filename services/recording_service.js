const Recording = require('../model/recording');

const ImageService = require('./image_service');
const MediaService = require('./media_service');
const ViewLogService = require('./view_log_service');
const CustomError = require("../utils/custom_error");

class RecordingService {
  constructor() {
    this.imageService = new ImageService();
    this.mediaService = new MediaService();
    this.viewLogService = new ViewLogService();
  }

  async insertRecording(recording_data) {
    const data = {
      title: recording_data.title,
      duration: recording_data.duration,
      position: recording_data.position,
      artistsort: recording_data.artistsort,
      displayedArtist: recording_data.displayedArtist,
      artist: recording_data.artist,
      // media: recording_data.media,
      mbid: recording_data.mbid,
      acoustid: recording_data.acoustid
    };

    try {
      const recording = await Recording.findOneAndUpdate(
        {mbid: recording_data.mbid},
        {$set: data},
        {new: true, upsert: true}
      );

      const image = await this.imageService.insertImage(recording_data.image, 'recording');
      if (image) {
        recording.image = image._id;
        await recording.save();
      }

      const media = await this.mediaService.insertMedia(recording_data.media)
      if (media) {
        recording.media = media._id;
        await recording.save();
      }

      return recording;
    } catch (error) {
      console.error(`Error upserting Recording: ${error.message}`);
      throw error;
    }
  }

  async getRecordingStream(recordingId, bitrate) {
    const recording = await Recording.findById(recordingId)
      .populate({
        path: 'media',
        select: '-fingerprint',
      });

    if (!recording) {
      console.error(`Recording with ID ${recordingId} not found.`);
      throw new CustomError(404, 'Recording not found.');
    }

    if (recording.view == null) {
      recording.view = 0;
    }

    const media = await this.mediaService.getMediaStreamByFilename(recording.media.filename, bitrate);

    recording.view += 1;
    await recording.save();

    await this.viewLogService.insertViewLog(recording);

    return media;
  }

  async getRecordingById(recordingId) {
    const recording = await Recording.findById(recordingId)
      .populate({
        path: 'media image',
        select: '-fingerprint'
      })

    if (!recording) {
      console.error(`Recording with ID ${recordingId} not found.`);
      throw new CustomError(404, 'Recording not found.');
    }

    return {recording: recording};
  }

  async getTopTracks(limit) {
    const recordings = await Recording.find()
      .sort({view: -1})
      .limit(limit)
      .populate({path: 'media image', select: '-fingerprint'});
    return recordings;
  }

  async getRecordingCount() {
    try {
      const count = await Recording.countDocuments();
      return count;
    } catch (e) {
      console.error(`Error getting recording count: ${e.message}`);
      throw new CustomError(500, 'Error getting recording count');
    }
  }

  async getUnavailableRecordings() {
    try {
      const recordings = await Recording.find({available: "pending"})
        .populate({path: 'media image', select: '-fingerprint'});
      return recordings;
    } catch (e) {
      console.error(`Error getting unavailable recordings: ${e.message}`);
      throw new CustomError(500, 'Error getting unavailable recordings');
    }
  }

  async updateRecordingAvailability(recordingId) {
    const currentRecording = await Recording.findById(recordingId);

    if (!currentRecording) {
      console.error(`Recording with ID ${recordingId} not found.`);
      throw new CustomError(404, 'Recording not found.');
    }

    const flippedAvailability = 'available' === currentRecording.available ? 'pending' : 'available';

    const updatedRecording = await Recording.findByIdAndUpdate(
      recordingId,
      {available: flippedAvailability},
      {new: true}
    );

    return updatedRecording;
  }

  async rejectRecordingAvailability(recordingId) {
    const currentRecording = await Recording.findById(recordingId);

    if (!currentRecording) {
      console.error(`Recording with ID ${recordingId} not found.`);
      throw new CustomError(404, 'Recording not found.');
    }

    const flippedAvailability = 'rejected' === currentRecording.available ? 'pending' : 'rejected';

    const updatedRecording = await Recording.findByIdAndUpdate(
      recordingId,
      {available: flippedAvailability},
      {new: true}
    );

    return updatedRecording;
  }

  async countUnavailableRecordings() {
    try {
      const count = await Recording.countDocuments({available: 'pending'});
      return count;
    } catch (e) {
      console.error(`Error getting count of unavailable recordings: ${e.message}`);
      throw new CustomError(500, 'Error getting count of unavailable recordings');
    }
  }

  async deleteRecordingById(recordingId) {
    try {
      const recording = await Recording.findOne({_id: recordingId}).populate({
        path: 'media image',
        select: '-fingerprint'
      });
      if (!recording) {
        console.error(`Recording with ID ${recordingId} not found.`);
        throw new CustomError(404, 'Recording not found.');
      }
      return recording;
    } catch (e) {
      console.error(`Error deleting recording: ${e.message}`);
      throw new CustomError(500, 'Error deleting recording');
    }
  }
}

module.exports = RecordingService;