const Listener = require('../model/listener');
const CustomError = require("../utils/custom_error");

class ListenerService {
  constructor() {
  }

  /**
   * Create a new listener
   * @param {string} displayName - Listener's display name
   * @param {Object} account - Account object ID
   * @returns {Promise<Listener>} - New listener
   */
  async createListener(displayName, account) {
    const listenerData = {
      displayName: displayName,
      account: account,
      membership: null
    }

    const newListener = new Listener(listenerData);
    await newListener.save();

    return newListener;
  }

  async getListenerByAccountId(accountId) {
    const listener = await Listener.findOne({account: accountId});

    if (!listener) {
      throw new CustomError(404, 'Listener not found');
    }

    if (listener.status === 'inactive') {
      throw new CustomError(403, 'Listener account is inactive');
    }

    return listener.populate([
      {path: 'membership'},
      {path: 'playlist', populate: {path: 'image'}}
    ]);
  }

  async updateListenerMembership(listener, membership) {
    listener.membership = membership;
    await listener.save();
    return listener;
  }

  async insertPlaylist(listenerId, playlist) {
    const listener = await Listener.findById(listenerId);
    listener.playlist.push(playlist);
    await listener.save();
    return listener
  }

  async removePlaylist(listenerId, playlistId) {
    const listener = await Listener.findById(listenerId);

    if (!listener) {
      throw new CustomError(404, 'Listener not found');
    }

    const initialLength = listener.playlist.length;
    listener.playlist = listener.playlist.filter(
      (element) => element._id.toString() !== playlistId.toString()
    );

    if (listener.playlist.length === initialLength) {
      throw new CustomError(404, 'Playlist not found in listener\'s playlists');
    }

    await listener.save();
    return listener;
  }
}

module.exports = ListenerService;