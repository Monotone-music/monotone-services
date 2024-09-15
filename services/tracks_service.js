const MinioService = require('./minio_service');
const path = require('path');
const fs = require("fs");
const {transcodeUsingFFmpeg} = require("../utils/audio_utils");
const CustomError = require("../utils/custom_error");

class TracksService {
    constructor() {
        this.minioService = new MinioService();
    }

    async streamTrack() {
        const musicPath = path.join(__dirname, '../temp/1-もし、空が晴れるなら.flac');

        if (!fs.existsSync(musicPath)) {
            throw new CustomError(404, 'Audio file not found');
        }

        const {buffer, fileSize} = await transcodeUsingFFmpeg(musicPath, '192');

        return {buffer, fileSize};
    }
}

module.exports = TracksService;