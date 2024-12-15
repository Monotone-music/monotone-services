const Media = require('../model/media');

const MinioService = require('./minio_service');

const {generateFingerprint, transcodePath, transcodeStream} = require('../utils/audio_utils');
const {calculateHash} = require('../utils/utils');

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
      hash: calculateHash(fs.readFileSync(media_data.path)),
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
    const normalizedBitrate =
      bitrate === 'lossless'
        ? 'lossless'
        : typeof bitrate === 'string' && bitrate.endsWith('kbps')
          ? bitrate.slice(0, -4)
          : bitrate;

    const bucketPath = normalizedBitrate === 'lossless'
      ? 'lossless'
      : `${normalizedBitrate}kbps`;

    try {
      const media = await this.minioService.getObject(mediaFilename, 'monotone', bucketPath);
      return media;
    } catch (e) {
      console.error(`Error getting media stream: ${e.message}`);
      throw new CustomError(404, e.message);
    }
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

  async checkMediaExists(mediaFilePath) {
    try {
      const fileBuffer = fs.readFileSync(mediaFilePath);
      const hash = calculateHash(fileBuffer);

      // Check for media with matching hash
      const existingMedia = await Media.findOne({hash: hash});

      if (existingMedia) {
        // Media already exists, delete the file
        fs.unlink(mediaFilePath, (err) => {
          if (err) {
            console.error(`Error deleting file ${mediaFilePath}: ${err.message}`);
          } else {
            console.log(`Successfully deleted file: ${mediaFilePath}`);
          }
        });
        throw new CustomError(409, 'Media already exists');
      }

      return existingMedia;
    } catch (error) {
      console.error(`Error in checkMediaExists: ${error.message}`);
      throw error;
    }
  }
}


module.exports = MediaService;