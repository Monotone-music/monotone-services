const https = require("https");
const zlib = require("zlib");
const {exec} = require("node:child_process");
const path = require("node:path");
const {normalizePath} = require("../utils/utils");
const data = require("./sample_data");

class AcoustidService {
    constructor() {
        this.baseUrl = "https://api.acoustid.org/v2/";
        this.acoustIDAPIKey = process.env.ACOUSTID_API_KEY;
    }

    /**
     * Query AcoustID for track metadata
     * @param filename - name of the audio file
     * @returns {Promise<any>}
     */
    async queryTrackMetadataWithAcoustid(filename) {
        const {duration, fingerprint} = await this.getTrackAcousticFingerprint(filename)

        const client = this.acoustIDAPIKey;
        const roundedDuration = Math.round(duration);
        const meta = 'recordings';
        const url = `${this.baseUrl}lookup?client=${client}&duration=${roundedDuration}&fingerprint=${fingerprint}&meta=${meta}`;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Encoding': 'gzip'
            }
        }

        return makeRequest(url, options);
    }

    /**
     * Generate a track's acoustic fingerprint
     * @returns {Promise<{fingerprint: string, duration: number}>}
     */
    async getTrackAcousticFingerprint(filename) {
        const result = await generateFingerprint(filename);
        return {
            fingerprint: result.fingerprint,
            duration: result.duration
        };
    }
}

/**
 * Generate a fingerprint for a track
 * @returns {Promise<{fingerprint: string, duration: number}>}
 */
function generateFingerprint(filename) {
    return new Promise((resolve, reject) => {
        exec(`fpcalc -json ${path.join(__dirname, normalizePath(`../temp/${filename}`))}`, (error, stdout) => {
            if (error) {
                return reject('Error generating fingerprint: ' + error);
            }
            const result = JSON.parse(stdout);
            resolve(result);
        });
    });
}

function makeRequest(url, options) {
    const gzip = zlib.createGzip();

    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result && result.status === 'ok') {
                    delete result.status;
                    resolve(result);
                } else {
                    reject('Error sending request');
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error:', error);
        });

        gzip.pipe(req);
        gzip.end();
    });
}

module.exports = AcoustidService;