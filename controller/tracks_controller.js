const Stream = require('stream');
const asyncHandler = require('../middleware/async_handler');
const TracksService = require("../services/tracks_service");

class TracksController {
    constructor() {
        this.trackService = new TracksService();
    }

    streamTrack = asyncHandler(async (req, res) => {
        const {buffer, fileSize} = await this.trackService.streamTrack();

        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': fileSize,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600'
        });

        const readableStream = new Stream.Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(res);
    });

    getTrackFingerprint = asyncHandler(async (req, res) => {
        const result = await this.trackService.getTrackAcousticFingerprint();
        res.status(200).json({
            status: 'ok', message: 'Fingerprint generated', data: {
                fingerprint: result.fingerprint,
                duration: result.duration
            }
        });
    });

    getTrackMetadata = asyncHandler(async (req, res) => {
        const result = await this.trackService.queryTrackMetadata();
        res.status(200).json({status: 'ok', message: 'Metadata retrieved', data: result});
    });

    getTrackStream = asyncHandler(async (req, res) => {
        try {
            const objectStream = await this.trackService.getTrackStream();

            // Set appropriate headers
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Transfer-Encoding', 'chunked');

            // Pipe the stream directly to the response
            objectStream.pipe(res);

            // Handle errors during streaming
            objectStream.on('error', (error) => {
                console.error('Error streaming track:', error);
                if (!res.headersSent) {
                    res.status(500).json({status: 'error', message: 'Error streaming track'});
                }
            });

            // Clean up when the stream ends
            objectStream.on('end', () => {
                res.end();
            });
        } catch (error) {
            console.error('Error in getTrackStream:', error);
            res.status(500).json({status: 'error', message: 'Error streaming track'});
        }
    });
}

module.exports = new TracksController();