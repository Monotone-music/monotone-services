const MinioService = require('./minio_service');
const {spawn} = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const logger = require('../init/logging');
const {Readable} = require('stream');

class TracksService {
    constructor() {
        this.minioService = new MinioService();
        this.musicPath = path.join(__dirname, '../temp/test.mp3');
    }

    async getPresignedUrlForTrack(objectName, expiryTimeInMinutes) {
        return this.minioService.getPresignedUrl(objectName, expiryTimeInMinutes);
    }

    async getRawAudio(objectName) {
        return this.minioService.getRawAudio(objectName);
    }

    async prepareTrackStream(start, end) {
        logger.info(`Checking if file exists at: ${this.musicPath}`);
        if (!fs.existsSync(this.musicPath)) {
            logger.error('File does not exist');
            throw new Error('File not found');
        }

        logger.info('File exists');

        const stat = fs.statSync(this.musicPath);
        const fileSize = stat.size;

        if (end > fileSize - 1) {
            end = fileSize - 1;
        }

        const contentLength = end - start + 1;

        // Calculate start and duration times in seconds
        const startTime = (start / fileSize) * (stat.mtimeMs / 1000);
        const duration = (contentLength / fileSize) * (stat.mtimeMs / 1000);

        // Create a pass-through stream
        const passThrough = new Readable({
            read() {
            }
        });

        // Use fluent-ffmpeg
        ffmpeg(this.musicPath)
            .setStartTime(startTime)
            .duration(duration)
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('start', (commandLine) => {
                logger.info('Spawned FFmpeg with command: ' + commandLine);
            })
            .on('error', (err) => {
                logger.error('An error occurred: ' + err.message);
                passThrough.emit('error', err);
            })
            .on('end', () => {
                logger.info('FFmpeg processing finished');
                passThrough.push(null); // End the stream
            })
            .pipe(passThrough);

        return {
            stream: passThrough,
            contentLength,
            fileSize,
            start,
            end
        };
    }
}

module.exports = TracksService;