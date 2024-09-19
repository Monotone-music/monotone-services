const minioClient = require('../init/obj_storage_init');
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

    async uploadObject(bucketName, objectName, filePath, metadata) {
        return new Promise((resolve, reject) => {
            minioClient.fPutObject(bucketName, objectName, filePath, metadata, function (err, etag) {
                if (err) {
                    logger.error(`Error uploading object: ${err}`);
                    reject(err);
                } else {
                    resolve(etag);
                }
            });
        });
    }
}

module.exports = MinioService;