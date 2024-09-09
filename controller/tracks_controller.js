const TracksService = require('../services/tracks_service');
const formatResponse = require('../utils/response_formatter');
const logger = require('../init/logging');

class TracksController {
    constructor() {
        this.tracksService = new TracksService();
    }

    async getTracks(req, reply) {
        try {
            const tracks = await this.tracksService.getPresignedUrlForTrack('test/test.mpeg');
            reply.status(200).send(formatResponse(200, 'Tracks retrieved successfully', tracks));
        } catch (error) {
            reply.status(500).send(formatResponse(500, 'An error occurred', null));
        }
    }

    async streamTrack(req, reply) {
        try {
            const chunkSize = parseInt(process.env.CHUNK_SIZE) || 1024 * 1024;
            const range = req.headers.range || "0";
            const start = Number(range.replace(/\D/g, ""));
            const end = start + chunkSize;
            console.log('start:', start, 'end:', end);

            const { stream, contentLength, fileSize, start: actualStart, end: actualEnd } =
                await this.tracksService.prepareTrackStream(start, end);

            const headers = {
                "Content-Range": `bytes ${actualStart}-${actualEnd}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "audio/mpeg",
            };

            reply.raw.writeHead(206, headers);

            stream.pipe(reply.raw);

            stream.on('error', (error) => {
                logger.error('Error in stream:', error);
                if (!reply.sent) {
                    reply.status(500).send(formatResponse(500, 'An error occurred while streaming', null));
                }
            });

            await new Promise((resolve, reject) => {
                reply.raw.on('finish', resolve);
                reply.raw.on('error', reject);
            });

        } catch (error) {
            logger.error('Error streaming track:', error);
            if (!reply.sent) {
                reply.status(500).send(formatResponse(500, 'An error occurred while streaming', null));
            }
        }
    }
}

module.exports = new TracksController();
