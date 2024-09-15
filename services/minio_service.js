const minioClient = require('../init/obj_storage_init');
const logger = require('../init/logging');

class MinioService {
    constructor() {
        this.bucketName = process.env.MINIO_BUCKET;
    }

    /**
     * Get an object from Minio
     * @param {string} objectName - The name of the object to get
     * @returns {Promise<stream.Readable>} - The object stream
     */
    getObject(objectName) {
        try {
            return minioClient.getObject(this.bucketName, objectName);
        } catch (error) {
            logger.error(`Error getting object from Minio: ${error.message}`);
            throw error;
        }
    }
}

module.exports = MinioService;