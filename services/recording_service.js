const Recording = require('../model/recording');

const ImageService = require('./image_service');
const MediaService = require('./media_service');
const CustomError = require("../utils/custom_error");

class RecordingService {
  constructor() {
    this.imageService = new ImageService();
    this.mediaService = new MediaService();
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

    const media = this.mediaService.getMediaStreamByFilename(recording.media.filename, bitrate);

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
}

module.exports = RecordingService;