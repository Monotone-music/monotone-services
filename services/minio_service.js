const minioClient = require('../init/obj_storage_init');
const path = require('path');
const logger = require('../init/logging');

class MinioService {
    constructor() {
        this.bucketName = process.env.MINIO_BUCKET;
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
            const stream = minioClient.listObjects(bucketName, prefix, true);
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
     * @returns {Promise<unknown>}
     * @param trackName
     * @param album
     * @param quality - '192', '320', defaults 'raw'
     */

    async getObject(trackName, album, quality = 'raw') {
        const qualityPath = quality === '192' ? '192kbps'
            : quality === '320' ? '320kbps'
                : 'raw';

        let fileExtension;

        switch (qualityPath) {
            case '192kbps':
                fileExtension = '.mp3';
                break;
            case '320kbps':
                fileExtension = '.mp3';
                break;
            default:
                fileExtension = '.flac';
        }


        const objectPath = path.join(qualityPath, album, `${trackName}${fileExtension}`);

        logger.info(`Retrieving object: ${objectPath}`);
        const objectStream = minioClient.getObject(this.bucketName, objectPath);

        return objectStream;
    }

    /**
     * Upload an object to Minio
     * @param buffer - buffer of the file
     * @param fileName - name of the file
     * @param mimeType - default 'audio/mpeg'
     * @param bucketName - default '
     * @returns {Promise<unknown>}
     */
    async uploadObject(buffer, fileName, mimeType = 'audio/flac', bucketName = 'monotone') {
        return new Promise((resolve, reject) => {
            minioClient.putObject(
                bucketName,
                fileName,
                buffer,
                buffer.length,
                {'Content-Type': mimeType}
            ).catch((error) => {
                logger.error(`Error uploading object: ${error}`);
                reject(error);
            });
            resolve();
        });
    }
}

module.exports = MinioService;