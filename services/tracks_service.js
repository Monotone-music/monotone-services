const MinioService = require('./minio_service');
const path = require('path');

class TracksService {
    constructor() {
        this.minioService = new MinioService();
    }

    async getPresignedUrlForTrack(objectName, expiryTimeInMinutes) {
        return this.minioService.getPresignedUrl(objectName, expiryTimeInMinutes);
    }

    async getRawAudio(objectName) {
        return this.minioService.getRawAudio(objectName);
    }

    async prepareTrackStream(start, end) {
    }
}

module.exports = TracksService;