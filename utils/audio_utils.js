const logger = require('../init/logging');
const {spawn} = require("child_process");


/**
 * transcode audio file to mp3 format at specified bitrate
 * @param audioPath - path to audio file
 * @param bitRate - bitrate for transcoding
 * @returns {Promise<unknown>}
 */
function transcodePath(audioPath, bitRate = '192') {
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

function transcodeStream(audioBuffer, bitRate = '192') {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn('ffmpeg', [
            '-i', 'pipe:0', // Read from standard input
            '-f', 'mp3',
            '-ar', '44100',
            '-ac', '2',
            '-b:a', `${bitRate}k`,
            'pipe:1'  // Output to standard output
        ]);

        const chunks = [];
        let fileSize = 0;

        // Pipe the audio buffer into FFmpeg
        ffmpegProcess.stdin.write(audioBuffer);
        ffmpegProcess.stdin.end(); // Close the stdin stream

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
                console.log(`Transcoded size: ${transcodedSize} bytes at ${bitRate}kbps`);
            }
        });

        ffmpegProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`FFmpeg process exited with code ${code}`);
                reject(new Error(`FFmpeg process exited with code ${code}`));
            } else {
                const buffer = Buffer.concat(chunks);
                resolve({ buffer, fileSize });
            }
        });

        ffmpegProcess.on('error', (err) => {
            reject(err); // Handle FFmpeg spawn errors
        });
    });
}

function filterReleasesByType(releases) {
    const albumReleases = releases.filter(release => {
        const releaseGroup = release['release-group'];
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

module.exports = {
    transcodePath,
    filterReleasesByType,
    filterDuplicateReleases
};
