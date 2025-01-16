const Release = require('../model/release');

class ReleaseService {
  constructor() {
  }

  async upsertRelease(release_data) {
    try {
      let data = {
        title: release_data.title,
        status: release_data.status,
        format: release_data.format,
        trackCount: release_data.trackCount,
        mbid: release_data.mbid,
      };

      const release = await Release.findOneAndUpdate(
        {title: release_data.title},
        {$set: data},
        {new: true, upsert: true}
      );

      return release;
    } catch (error) {
      console.error(`Error upserting Release: ${error.message}`);
      throw error;
    }
  }

  async appendRecordingToRelease(release_mbid, recordingID) {
    try {
      const release = await Release.findOne({mbid: release_mbid});
      if (!release) {
        console.error(`Release with MBID ${release_mbid} not found.`);
        throw new Error('Release not found.');
      }

      await release.updateOne({
        $addToSet: {recording: recordingID},
      });

    } catch (error) {
      console.error(`Error updating Release with Recording ID: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ReleaseService;