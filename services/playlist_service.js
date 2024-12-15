const Playlist = require('../model/playlist');
const CustomError = require("../utils/custom_error");

const RecordingService = require('./recording_service');
const ListenerService = require('./listener_service');

class PlaylistService {
  constructor() {
    this.recordingService = new RecordingService();
    this.listenerService = new ListenerService();
  }

  async createPlaylist(name) {
    return await Playlist.create({name});
  }

  async getPlaylistById(playlistId) {
    return Playlist.findById(playlistId)
      .populate({
        path: 'recording.recording',
        model: 'recording',
        populate: [
          {
            path: 'media',
            model: 'media',
            select: '-fingerprint',
          },
          {
            path: 'image',
            model: 'image'
          }
        ]
      })
      .populate({
        path: 'image',
        model: 'image'
      });
  }


  async addRecordingToPlaylist(playlistId, recordingId) {
    const playlist = await Playlist.findById(playlistId).populate({
      path: 'recording.recording',
      model: 'recording'
    }).populate({
      path: 'image',
      model: 'image'
    });
    const recording = await this.recordingService.getRecordingById(recordingId);

    if (!recording) {
      throw new CustomError(404, 'Recording not found');
    }

    if (playlist.recording.length === 0) {
      console.log('Playlist has no recordings');
      await this.#setPlaylistWithFirstRecordingImage(playlistId, recordingId);
    }

    // Determine the next index
    const nextIndex = playlist.recording.length > 0
      ? Math.max(...playlist.recording.map((item) => item.index)) + 1
      : 0;

    playlist.recording.push({recording: recordingId, index: nextIndex});
    const updatedPlaylist = await playlist.save();

    const populatedPlaylist = await Playlist.findById(updatedPlaylist._id)
      .populate({
        path: 'recording.recording',
        model: 'recording'
      })
      .populate({
        path: 'image',
        model: 'image'
      });

    return populatedPlaylist;
  }

  async removeRecordingFromPlaylist(playlistId, indexToRemove) {
    const playlist = await Playlist.findById(playlistId).populate({path: 'recording.recording'});

    if (!playlist) {
      throw new CustomError(404, 'Playlist not found.');
    }

    if (indexToRemove < 0 || indexToRemove >= playlist.recording.length) {
      throw new CustomError(404, 'Invalid index. No recording found at the specified index.');
    }

    playlist.recording.splice(indexToRemove, 1);

    playlist.recording = playlist.recording.map((item, i) => ({
      ...item,
      index: i,
    }));

    // Save the updated playlist
    return await playlist.save();
  }


  async updatePlaylist(playlistId, platlistName) {
    const updatedData = {
      name: platlistName,
    };

    try {
      const playlist = await Playlist.findByIdAndUpdate(playlistId, updatedData, {new: true});

      return playlist;
    } catch (e) {
      console.error(`Error updating playlist: ${e.message}`);
      throw new CustomError(500, 'Error updating playlist');
    }
  }

  async deletePlaylist(playlistId, accountId) {
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
      throw new CustomError(404, 'Playlist not found');
    }

    const listener = await this.listenerService.getListenerByAccountId(accountId);

    if (!listener) {
      throw new CustomError(404, 'Listener not found');
    }

    await this.listenerService.removePlaylist(listener._id, playlistId);

    return deletedPlaylist;
  }

  async #setPlaylistWithFirstRecordingImage(playlistId, recordingId) {
    const playlist = await Playlist.findById(playlistId);
    const recording = await this.recordingService.getRecordingById(recordingId);

    playlist.image = recording.recording.image;
    await playlist.save();
  }
}

module.exports = PlaylistService;