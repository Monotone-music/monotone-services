const ffmpeg = require('fluent-ffmpeg');
const logger = require('../init/logging');

/**
 * Get the duration of an audio file using ffprobe.
 * @param {string} filePath - The path to the audio file.
 * @returns {Promise<number>} - The duration of the file in seconds.
 */
function getFileDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                logger.error(`Error getting duration of file ${filePath}: ${err.message}`);
                reject(err);
            } else {
                logger.info(`Duration of file ${filePath}: ${metadata.format.duration}`);
                resolve(metadata.format.duration);
            }
        });
    });
}

module.exports = {
    getFileDuration
};
