const MinioService = require('./minio_service');
const MusicbrainzService = require('./musicbrainz_service');
const AcoustIDService = require('./acoustid_service');

const path = require('path');
const fs = require("fs");
const {exec} = require("child_process");
const {transcodePath, filterReleasesByType, filterDuplicateReleases} = require("../utils/audio_utils");
const CustomError = require("../utils/custom_error");
const logger = require('../init/logging');

class TracksService {
  constructor() {
    this.minioService = new MinioService();
    this.musicbrainzService = new MusicbrainzService();
    this.acoustidService = new AcoustIDService();
    this.acoustIDAPIKey = process.env.ACOUSTID_API_KEY;
  }

  /**
   * Stream a track
   * @returns {Promise<{buffer: Buffer, fileSize: number}>} - The buffer and file size
   */
  async streamTrack() {
    const musicPath = path.join(__dirname, '../temp/aaa.mp3');

    if (!fs.existsSync(musicPath)) {
      throw new CustomError(404, 'Audio file not found');
    }

    const {buffer, fileSize} = await transcodePath(musicPath, '192');

    return {buffer, fileSize};
  }

  async uploadTrack(tracks) {

  }

  async applyMetadataToTrack() {

  }

  async getTrackStream() {
    return await this.minioService.getObject('2-faraway-country', 'Cafe de Touhou 1', 'a');
  }

  /**
   * Query AcoustID for track metadata
   * @returns {Promise<any>}
   */

  // acoust.results[0].recordings[0].artists[] = artists
  // acoust.results[0].recordings[0].title = title
  // acoust.results[0].recordings[0].duration = duration
  // acoust.results[0].recordings[0].releasegroups[0].releases[0].title = album name
  // acoust.results[0].recordings[0].releasegroups[0].releases[0].date = release date
  // acoust.results[0].recordings[0].releasegroups[0].releases[0].media[0] = release media information
  // **note that media[0].position is the disc number and media[0].tracks[0].position is the track number

  async queryTrackMetadata() {
    try {
      const acoustidResults = await this.acoustidService.queryTrackMetadataWithAcoustid('eos.mp3');
      console.log(acoustidResults);
      if (!acoustidResults.results || acoustidResults.results.length === 0) {
        console.error('No results found in AcoustID.');
        return [];
      }

      const acoustIdRecordings = acoustidResults.results[0].recordings;
      const numberOfResults = 10;

      const recordingIds = acoustIdRecordings
        .filter(recording => recording.id) // Keep only recordings with an id
        .slice(0, numberOfResults) // Limit to the specified number of results (5)
        .map(recording => recording.id); // Extract the IDs

      const recordingMetadataPromises = recordingIds.map(async (recordingId) => {
        try {
          const recordingMetadata = await this.musicbrainzService.getRecordingMetadata(recordingId);

          if (recordingMetadata.error) {
            console.warn(`Recording ID ${recordingId} not found: ${recordingMetadata.error}`);
            return null;
          }

          const filtered = filterReleasesByType(recordingMetadata.releases);
          return filtered.length > 0 ? filtered[0] : null;
        } catch (error) {
          console.error(`Error fetching metadata for recording ID ${recordingId}:`, error);
          return null;
        }
      });

      const recordingsMetadata = await Promise.all(recordingMetadataPromises);

      const filteredReleases = filterDuplicateReleases(recordingsMetadata.filter(result => result !== null));
      return acoustidResults
    } catch (error) {
      console.error('Error: ', error);
    }
  }

  /**
   * Generate a track's acoustic fingerprint
   * @returns {Promise<{fingerprint: string, duration: number}>}
   */
  async getTrackAcousticFingerprint() {
    const result = await generateFingerprint();
    return {
      fingerprint: result.fingerprint,
      duration: result.duration
    };
  }
}

/**
 * Generate a fingerprint for a track
 * @returns {Promise<{fingerprint: string, duration: number}>}
 */
function generateFingerprint() {
  return new Promise((resolve, reject) => {
    exec(`fpcalc -json ${path.join(__dirname, '../temp/1-もし、空が晴れるなら.flac')}`, (error, stdout) => {
      if (error) {
        return reject('Error generating fingerprint: ' + error);
      }
      const result = JSON.parse(stdout);
      resolve(result);
    });
  });
}

module.exports = TracksService;