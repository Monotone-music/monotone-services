const MinioService = require('./minio_service');
const MusicbrainzService = require('./musicbrainz_service');
const AcoustIDService = require('./acoustid_service');
const ArtistService = require('./artist_service');
const RecordingService = require('./recording_service');
const ReleaseGroupService = require('./release_group_service');
const ReleaseService = require('./release_service');
const ElasticService = require('./elastic_service');

const mongoose = require('mongoose');

const path = require('path');
const fs = require("fs");
const {exec} = require("child_process");
const {transcodePath, filterReleasesByType, filterDuplicateReleases} = require("../utils/audio_utils");
const CustomError = require("../utils/custom_error");
const mm = require('music-metadata');
const util = require('util');
const logger = require('../init/logging');

class TracksService {
  constructor() {
    this.minioService = new MinioService();
    this.musicbrainzService = new MusicbrainzService();
    this.acoustidService = new AcoustIDService();
    this.recordingService = new RecordingService();
    this.artistService = new ArtistService();
    this.releaseGroupService = new ReleaseGroupService();
    this.releaseService = new ReleaseService();
    this.elasticService = new ElasticService();
  }

  async parseTrackMetadata(files) {
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

          const recording = await this.recordingService.insertRecording(metadata.recording);
          await this.releaseGroupService.updateReleaseGroupImage(releaseGroup._id, recording.image);
          await this.releaseService.appendRecordingToRelease(release.mbid, recording._id);

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
        }
      }
      return true;
    } catch (error) {
      console.error('Overall metadata parsing error:', error.message);
      return [];
    }
  }

  async getTrackStream(recordingId, bitrate) {
    const recording = await this.recordingService.getRecordingStream(recordingId, bitrate);
    return recording;
  }
}

module.exports = TracksService;