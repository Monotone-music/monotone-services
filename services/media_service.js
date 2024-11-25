const Media = require('../model/media');

const MinioService = require('./minio_service');

const {generateFingerprint, transcodePath, transcodeStream} = require('../utils/audio_utils');

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const CustomError = require("../utils/custom_error");

class MediaService {
  constructor() {
    this.minioService = new MinioService();
  }

  async insertMedia(media_data) {
    const data = {
      filename: media_data.filename || null,
      originalName: media_data.originalname,
      extension: path.extname(media_data.filename),
      size: media_data.size,
      mimetype: media_data.mimetype,
      fingerprint: media_data.fingerprint || null,
    }

    const objFilename = path.basename(data.filename, path.extname(data.filename));
    data.filename = objFilename;

    try {
      const fingerprint = await generateFingerprint(media_data.path);
      data.fingerprint = fingerprint;

      const existingMedia = await Media.findOne({fingerprint});
      if (existingMedia) {
        fs.unlink(media_data.path, (err) => {
          if (err) {
            console.error(`Error deleting file ${media_data.path}: ${err.message}`);
          } else {
            console.log(`Successfully deleted file: ${media_data.path}`);
          }
        });
        return existingMedia;
      }

      const newMedia = await Media.create(data);

      await this.#processAndUploadMedia(media_data.path, objFilename, media_data.mimetype);

      return newMedia;
    } catch (error) {
      console.error(`Error upserting Media: ${error.message}`);
      throw error;
    }
  }

  async getMediaStreamByFilename(mediaFilename, bitrate) {
    const bucketPath = bitrate ? `${bitrate}kbps` : 'lossless';

    const media = await this.minioService.getObject(mediaFilename, 'monotone', bucketPath);

    return media;
  }

  async #processAndUploadMedia(mediaFilePath, filename, mimetype) {
    const bitRates = ['192', '320'];
    const bucketPaths = {
      lossless: 'lossless/',
      192: '192kbps/',
      320: '320kbps/',
    };

    try {
      const originalBuffer = fs.readFileSync(mediaFilePath);
      await this.minioService.uploadObject(
        originalBuffer,
        filename,
        mimetype,
        'monotone',
        'lossless'
      );

      const transcodingPromises = bitRates.map(async (bitRate) => {
        const {buffer} = await transcodePath(mediaFilePath, bitRate);

        await this.minioService.uploadObject(
          Buffer.from(buffer),
          filename,
          'audio/mpeg',
          'monotone',
          bucketPaths[bitRate]
        );
      });

      await Promise.all(transcodingPromises);

      fs.unlink(mediaFilePath, (err) => {
        if (err) {
          console.error(`Error deleting file ${mediaFilePath}: ${err.message}`);
        } else {
          console.log(`Successfully deleted file: ${mediaFilePath}`);
        }
      });
    } catch (error) {
      console.error(`Error processing media: ${error.message}`);
      throw error;
    }
  }
}


module.exports = MediaService;