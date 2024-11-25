const MinioClient = require('../init/obj_storage_init');
const path = require('path');
const logger = require('../init/logging');

class MinioService {
  constructor() {
    this.bucketName = process.env.MINIO_BUCKET;
    this.minioClient = MinioClient;
  }

  /**
   * Get an object from Minio
   * @returns {Promise<unknown>}
   * @param bucketName
   * @param prefix
   */
  async listObjects(bucketName, prefix) {
    return new Promise((resolve, reject) => {
      const objects = [];
      const stream = this.minioClient.listObjects(bucketName, prefix, true);
      stream.on('data', (obj) => {
        objects.push(obj);
      });
      stream.on('error', (err) => {
        logger.error(`Error listing objects: ${err}`);
        reject(err);
      });
      stream.on('end', () => {
        resolve(objects);
      });
    });
  }

  /**
   * Get an object from Minio
   * @param filename
   * @param bucket
   * @param folder
   */
  async getObject(filename, bucket, folder) {
    try {
      const objectKey = folder ? `${folder}/${filename}` : filename;

      const objectStream = await this.minioClient.getObject(bucket, objectKey);
      const objectStat = await this.minioClient.statObject(bucket, objectKey);

      const chunks = [];
      for await (const chunk of objectStream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      return {
        buffer: buffer,
        fileSize: objectStat.size,
        mimetype: objectStat.metaData['content-type']
      }
    } catch (error) {
      console.error(`Error retrieving object '${filename}' from bucket '${bucket}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload an object to Minio
   * @param buffer
   * @param fileName
   * @param mimeType
   * @param bucketName
   * @param folder
   * @returns {Promise<unknown>}
   */
  async uploadObject(buffer, fileName, mimeType = '', bucketName = 'monotone', folder = '') {
    return new Promise((resolve, reject) => {
      // Ensure the folder is properly formatted (with a trailing slash)
      const folderPath = folder ? folder.endsWith('/') ? folder : `${folder}/` : '';

      // Construct the full file path with folder included
      const filePath = folderPath + fileName;

      this.minioClient.putObject(
        bucketName,
        filePath,
        buffer,
        buffer.length,
        {'Content-Type': mimeType}
      ).then(() => {
        resolve(); // Successfully uploaded
      }).catch((error) => {
        logger.error(`Error uploading object: ${error}`);
        reject(error); // Reject if there's an error
      });
    });
  }

}

module.exports = MinioService;