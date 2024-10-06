const logger = require('../init/logging');
const {spawn} = require("child_process");


/**
 * transcode audio file to mp3 format at specified bitrate
 * @param audioPath - path to audio file
 * @param bitRate - bitrate for transcoding
 * @returns {Promise<unknown>}
 */
function transcodeUsingFFmpeg(audioPath, bitRate = '192') {
    return new Promise((resolve, reject) => {
        const ffmpegArgs = [
            '-i', audioPath,
            '-f', 'mp3',
            '-ar', '44100',
            '-ac', 2,
            '-b:a', bitRate.toString() + 'k',
            'pipe:1'  // Output to stdout
        ];

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        const chunks = [];
        let fileSize = 0;

        ffmpegProcess.stdout.on('data', (chunk) => {
            chunks.push(chunk);
            fileSize += chunk.length;
        });

        ffmpegProcess.stderr.on('data', (data) => {
            const log = data.toString();
            const sizeMatch = log.match(/size=\s*(\d+)KiB/);
            let transcodedSize;
            if (sizeMatch) {
                transcodedSize = parseInt(sizeMatch[1]) * 1024;  // Convert KiB to bytes
                logger.info(`Transcoded size: ${transcodedSize} bytes at ${bitRate}kbps`);
            }
        });

        ffmpegProcess.on('close', (code) => {
            if (code !== 0) {
                logger.error(`FFmpeg process exited with code ${code}`);
                reject(new Error(`FFmpeg process exited with code ${code}`));
            } else {
                const buffer = Buffer.concat(chunks);
                resolve({buffer, fileSize});
            }
        });
    });
}

function filterReleasesByType(releases) {
    return releases.filter(release => {
        const releaseGroup = release['release-group'];

        // Check if primary-type is "Album" and secondary-types array is empty or undefined
        const isAlbum = releaseGroup?.['primary-type'] === 'Album' || 'Single';
        const hasNoSecondaryType = !releaseGroup?.['secondary-types'] || releaseGroup['secondary-types'].length === 0;

        return isAlbum && hasNoSecondaryType;
    });
}

module.exports = {
    transcodeUsingFFmpeg,
    filterReleasesByType
};
