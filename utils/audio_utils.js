const logger = require('../init/logging');
const {spawn, exec} = require("child_process");
const path = require("path");
const ffmpeg = require('fluent-ffmpeg');
const CustomError = require("./custom_error");

function handleFFmpegOutput(ffmpegProcess, bitRate) {
  const chunks = [];
  let fileSize = 0;

  return new Promise((resolve, reject) => {
    ffmpegProcess.stdout.on('data', (chunk) => {
      chunks.push(chunk);
      fileSize += chunk.length;
    });

    ffmpegProcess.stderr.on('data', (data) => {
      const log = data.toString();
      const sizeMatch = log.match(/size=\s*(\d+)KiB/);
      if (sizeMatch) {
        const transcodedSize = parseInt(sizeMatch[1]) * 1024;
      }
    });

    ffmpegProcess.on('close', (code) => {
      if (code !== 0) {
        console.log('FFmpeg process exited with reason:' + code);
        reject(new CustomError(400, `FFmpeg process exited with code ${code}`));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });

    ffmpegProcess.on('error', reject); // Catch spawn errors
  });
}

/**
 * Transcode audio from a file path.
 * @param {string} audioPath - Path to the audio file.
 * @param {number|string} bitRate - Target bitrate for transcoding.
 * @returns {Promise<{buffer: Buffer, fileSize: number}>}
 */
function transcodePath(audioPath, bitRate = '192') {
  const ffmpegProcess = spawn('ffmpeg', [
    '-i', audioPath,
    '-f', 'mp3',
    '-b:a', `${bitRate}k`,
    'pipe:1'
  ]);

  return handleFFmpegOutput(ffmpegProcess, bitRate);
}

/**
 * Transcode audio from a buffer.
 * @param {Buffer} audioBuffer - The audio buffer to transcode.
 * @param {number|string} bitRate - Target bitrate for transcoding.
 * @returns {Promise<{buffer: Buffer, fileSize: number}>}
 */
function transcodeStream(audioBuffer, bitRate = '192') {
  const ffmpegProcess = spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-f', 'mp3',
    '-b:a', `${bitRate}k`,
    'pipe:1'
  ]);

  // Pipe the buffer to ffmpeg
  ffmpegProcess.stdin.write(audioBuffer);
  ffmpegProcess.stdin.end();

  return handleFFmpegOutput(ffmpegProcess, bitRate);
}


function filterReleasesByType(releasegroups) {
  const albumReleases = releasegroups.filter(releasegroup => {
    const releaseGroup = releasegroup['release-group'];
    return releaseGroup?.['primary-type'] === 'Album' && (!releaseGroup['secondary-types'] || releaseGroup['secondary-types'].length === 0);
  });

  if (albumReleases.length > 0) {
    return albumReleases;
  } else {
    return releases.filter(release => {
      const releaseGroup = release['release-group'];
      return releaseGroup?.['primary-type'] === 'Single' && (!releaseGroup['secondary-types'] || releaseGroup['secondary-types'].length === 0);
    });
  }
}

function filterDuplicateReleases(releases) {
  const uniqueTitles = new Set();
  return releases.filter(item => {
    if (!uniqueTitles.has(item.title)) {
      uniqueTitles.add(item.title);
      return true;
    }
    return false;
  });
}

/**
 * Generate a fingerprint for a track
 * @returns {Promise<{fingerprint: string, duration: number}>}
 */
function generateFingerprint(filename) {
  return new Promise((resolve, reject) => {
    exec(`fpcalc -json ${filename}`, (error, stdout) => {
      if (error) {
        console.log('Error generating fingerprint:', error)
        return reject('Error generating fingerprint: ' + error);
      }
      const result = JSON.parse(stdout);
      resolve(result);
    });
  });
}

module.exports = {
  generateFingerprint,
  transcodePath,
  transcodeStream,
  filterReleasesByType,
  filterDuplicateReleases
};
