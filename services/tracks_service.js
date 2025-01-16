const ArtistService = require('./artist_service');
const RecordingService = require('./recording_service');
const ReleaseGroupService = require('./release_group_service');
const ReleaseService = require('./release_service');
const ElasticService = require('./elastic_service');
const LabelService = require('./label_service');
const TokenService = require('./token_service');
const MediaService = require('./media_service');

const {calculateHash} = require('../utils/utils');

const mm = require('music-metadata');
const CustomError = require("../utils/custom_error");

class TracksService {
  constructor() {
    this.recordingService = new RecordingService();
    this.artistService = new ArtistService();
    this.releaseGroupService = new ReleaseGroupService();
    this.releaseService = new ReleaseService();
    this.elasticService = new ElasticService();
    this.labelService = new LabelService();
    this.tokenService = new TokenService();
    this.mediaService = new MediaService();
  }

  async parseTrackMetadata(files, accountId, flag = 'label') {
    try {
      const fileArray = Array.isArray(files) ? files : [files];

      for (const file of fileArray) {
        try {
          const parsedMetadata = await mm.parseFile(file.path);

          const {common, format, native} = parsedMetadata;

          const processedIds = new Set();

          const metadata = {
            artist: common.artists,
            release_group: {
              title: common.album,
              releaseType: common.releasetype[0],
              albumArtist: common.albumartist,
              releaseEvent: {
                date: common.date,
                country: common.releasecountry
              },
              genre: common.genre ? common.genre[0] : null,
              mbid: common.musicbrainz_releasegroupid
            },
            release: {
              title: common.album,
              status: common.releasestatus,
              format: common.media,
              trackCount: common.track.of,
              mbid: common.musicbrainz_albumid,
              release_group_mbid: common.musicbrainz_releasegroupid,
            },
            recording: {
              title: common.title,
              duration: format.duration,
              position: common.track,
              artistsort: common.artistsort,
              displayedArtist: common.artist,
              media: file,
              image: common.picture ? common.picture[0] : null,
              artist: [],
              release_mbid: common.musicbrainz_albumid,
              mbid: common.musicbrainz_recordingid,
              acoustid: common.acoustid_id
            },
            image: {data: common.picture ? common.picture[0] : null}
          };

          await this.mediaService.checkMediaExists(metadata.recording.media.path);

          // handle saving the artists
          const artistIds = await this.artistService.upsertMultipleArtists(metadata.artist);

          const updatedArtists = metadata.artist.map(artistName => {
            const artist = artistIds.find(artist => artist.name === artistName);
            return {
              _id: artist ? artist._id : null,
              name: artistName,
            };
          });
          metadata.recording.artist = updatedArtists;

          if (metadata.release_group.artist === 'Various Artists') {
            metadata.release_group.releaseType = 'compilation';
          }

          // Handle saving the release group
          const releaseGroup = await this.releaseGroupService.upsertReleaseGroup(metadata.release_group);

          const albumArtists = updatedArtists.filter(artist =>
            Array.isArray(metadata.release_group.albumArtist)
              ? metadata.release_group.albumArtist.includes(artist.name)
              : artist.name === metadata.release_group.albumArtist
          );

          const featuredArtists = updatedArtists.filter(artist =>
            !albumArtists.some(albumArtist => albumArtist.name === artist.name)
          );

          await Promise.all(
            albumArtists.map(async (albumArtist) => {
              await this.artistService.appendToArtistArray(albumArtist._id, 'releaseGroup', releaseGroup._id);
            })
          );

          await Promise.all(
            featuredArtists.map(async (featuredArtist) => {
              await this.artistService.appendToArtistArray(featuredArtist._id, 'featuredIn', releaseGroup._id);
            })
          );

          const release = await this.releaseService.upsertRelease(metadata.release);

          await this.releaseGroupService.appendToReleaseGroupArray(releaseGroup._id, 'release', release._id);
          metadata.recording.release_mbid = release.mbid;

          let recording;
          switch (flag) {
            case 'label':
              recording = await this.recordingService.insertRecording(metadata.recording, 'label');
              break;
            case 'artist':
              recording = await this.recordingService.insertRecording(metadata.recording, 'artist');
              break;
          }

          const releaseGroupWithImage = await this.releaseGroupService.updateReleaseGroupImage(releaseGroup._id, recording.image);
          await this.releaseService.appendRecordingToRelease(release.mbid, recording._id);

          for (const artist of updatedArtists) {
            try {
              await this.artistService.updateArtistImage(artist._id, recording.image);
            } catch (imageUpdateError) {
              console.error(`Error updating image for artist ${artist.name}: ${imageUpdateError.message}`);
            }
          }

          switch (flag) {
            case 'label':
              await this.labelService.appendReleaseGroupToLabel(accountId, releaseGroupWithImage);
              break;
            case 'artist':
              await this.labelService.appendReleaseGroupToLabel('6785c6e29b2f03e63be692c9', releaseGroupWithImage);
              break;
          }

          if (!processedIds.has(`${releaseGroup.releaseType}:${releaseGroup._id}`)) {
            await this.elasticService.addDocument(
              metadata.release_group.title,
              releaseGroup.releaseType,
              releaseGroup._id
            );
            processedIds.add(`${releaseGroup.releaseType}:${releaseGroup._id}`);
          }

          if (!processedIds.has(`recording:${recording._id}`)) {
            await this.elasticService.addDocument(
              metadata.recording.title,
              'recording',
              recording._id
            );
            processedIds.add(`recording:${recording._id}`);
          }

          const uniqueArtists = new Set(metadata.artist);
          for (const artist of uniqueArtists) {
            const artistId = artistIds.find(a => a.name === artist)?._id;
            if (artistId && !processedIds.has(`artist:${artistId}`)) {
              await this.elasticService.addDocument(
                artist,
                'artist',
                artistId
              );
              processedIds.add(`artist:${artistId}`);
            }
          }

        } catch (fileError) {
          console.error(`Error processing file ${file.path}:`, fileError.message);
          throw new CustomError(400, 'Error processing file');
        }
      }
      return true;
    } catch (error) {
      console.error('Overall metadata parsing error:', error.message);
      throw new CustomError(400, 'Error processing files');
    }
  }

  async getTrackStream(recordingId, bitrate) {
    // const listenerId = listener?._id;
    const recording = await this.recordingService.getRecordingStream(recordingId, bitrate);
    return recording;
  }

  async getTopTracks(limit) {
    const topTracks = await this.recordingService.getTopTracks(limit);
    return topTracks;
  }

  async getTracksCount() {
    const count = await this.recordingService.getRecordingCount();
    return count;
  }

  async getTracksGeneralInfo(recordingId) {
    const trackInfo = await this.recordingService.getRecordingById(recordingId);
    return trackInfo;
  }
}

module.exports = TracksService;