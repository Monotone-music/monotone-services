const minioClient = require('../init/obj_storage_init');
const logger = require('../init/logging');

class MinioService {
    constructor() {
        this.bucketName = process.env.MINIO_BUCKET;
    }

    async getPresignedUrl(objectName, expiryTimeInMinutes = 60) {
        try {
            const presignedUrl = await minioClient.presignedGetObject(
                this.bucketName,
                objectName,
                expiryTimeInMinutes * 60); //convert minutes to seconds
            logger.info('Presigned URL generated successfully');
            return presignedUrl;
        } catch (err) {
            logger.error('Error generating presigned URL:', err);
            throw err;
        }
    }

    async getRawAudio(objectName) {
        try {
            const stream = await minioClient.getObject(this.bucketName, objectName);
            logger.info(`Streaming audio for object: ${objectName}`);
            return stream;
        } catch (err) {
            logger.error('Error streaming audio:', err);
            throw err;
        }
    }
}

module.exports = MinioService;