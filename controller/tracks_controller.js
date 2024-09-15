const fs = require('fs');
const path = require('path');
const Stream = require('stream');

const asyncHandler = require('../middleware/async_handler');
const TracksService = require("../services/tracks_service");

class TracksController {
    constructor() {
        this.trackService = new TracksService();
    }

    streamTrack = asyncHandler(async (req, res) => {
        const {buffer, fileSize} = await this.trackService.streamTrack();

        res.writeHead(206, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': fileSize,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600'
        });

        // Create a readable stream from the buffer and pipe it to the response
        const readableStream = new Stream.Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(res);
    });
}

module.exports = new TracksController();