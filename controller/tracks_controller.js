const {spawn} = require('child_process');
const fs = require('fs');
const path = require('path');
const formatResponse = require('../utils/response_formatter');
const logger = require('../init/logging');

class TracksController {
    constructor() {
    }

    /**
     * TODO: Finish transcoding function to pipe correct headers: Content-Length, and chunkify output stream to ensure performance
     */
    async streamTrack(req, res) {
        try {
            const musicPath = path.join(__dirname, '../temp/1-もし、空が晴れるなら.flac'); // Adjust the file path

            if (!fs.existsSync(musicPath)) {
                res.status(404).json(formatResponse(404, 'Audio file not found', null));
                return;
            }

            const duration = await getAudioDuration(musicPath); // Get duration in seconds
            const bitrate = 192000; // MP3 bitrate in bits per second
            const estimatedMp3FileSize = Math.floor((duration * bitrate) / 8);
            logger.info(`Estimated MP3 file size: ${estimatedMp3FileSize} bytes`);

            res.writeHead(206, {
                'Content-Type': 'audio/mpeg',
                'Transfer-Encoding': 'chunked',
                'Content-Length': estimatedMp3FileSize
            });

            await transcodeUsingFFmpeg(musicPath, res);
        } catch (error) {
            logger.error(`Error in streamTrack: ${error.message}`);
            res.status(500).json(formatResponse(500, 'An error occurred', null));
        }
    }
}

function transcodeUsingFFmpeg(inputPath, res) {
    return new Promise((resolve, reject) => {
        const ffmpegArgs = [
            '-i', inputPath,  // Input file
            '-f', 'mp3',      // Output format
            '-ar', '44100',   // Sampling rate
            '-ac', 2,         // Stereo
            '-b:a', '192k',   // Bitrate
            'pipe:1'          // Pipe the output
        ];

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        let transcodedSize = 0;

        ffmpegProcess.stderr.on('data', (data) => {
            const log = data.toString();
            const sizeMatch = log.match(/size=\s*(\d+)KiB/);
            // logger.info(`sizeMatch: ${sizeMatch}`);
            if (sizeMatch) {
                transcodedSize = parseInt(sizeMatch[1]) * 1024;  // Convert KiB to bytes
                logger.info(`Transcoded size: ${transcodedSize} bytes`);
            }
        });

        ffmpegProcess.stdout.pipe(res);

        ffmpegProcess.stdout.on('end', () => {
            ffmpegProcess.kill();
            res.end();
        });

        ffmpegProcess.on('close', (code) => {
            if (code !== 0) {
                logger.error(`FFmpeg process exited with code ${code}`);
            }
        });

        resolve();
    });
}

function getAudioDuration(input) {
    return new Promise((resolve, reject) => {
        const ffprobeArgs = [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            input
        ];

        const ffprobeProcess = spawn('ffprobe', ffprobeArgs);
        let output = '';

        ffprobeProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        ffprobeProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`FFprobe process exited with code ${code}`));
            } else {
                const duration = parseFloat(output.trim());
                resolve(duration);
            }
        });
    })
}

async function testAudioSize(path) {
    try {
        const duration = await getAudioDuration(path);
        logger.info(`The audio duration is ${duration} seconds`);

        // Calculate file size based on duration and bitrate
        const bitrate = 192000; // 192 kbps
        const estimatedSizeInBytes = Math.ceil(duration * bitrate / 8);
        logger.info(`Estimated MP3 file size: ${estimatedSizeInBytes} bytes`);
    } catch (error) {
        logger.error('Error getting audio duration:', error);
    }
}

module.exports = new TracksController();
