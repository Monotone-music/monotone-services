const https = require('https');
const querystring = require('querystring');

class MusicBrainzService {
  constructor() {
    this.baseUrl = 'https://musicbrainz.org/ws/2/';
    this.userAgent = 'monotone/0.1.0 ( ddawng184@gmail.com )';
    this.defaultIncludes = 'artists+releases+release-groups+media+tags';
  }

  makeRequest(path, params = {}) {
    params.inc = this.defaultIncludes;
    const queryString = querystring.stringify(params);
    const url = `${this.baseUrl}${path}?${queryString}&fmt=json`;

    const options = {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent
      }
    };

    return new Promise((resolve, reject) => {
      https.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      }).on('error', err => {
        reject(err);
      });
    });
  }

  async getRecordingMetadata(recordingId) {
    try {
      return await this.makeRequest(`recording/${recordingId}`);
    } catch (error) {
      console.error('Error fetching recording metadata:', error);
    }
  }

  async getReleaseMetadata(releaseId) {
    try {
      const result = await this.makeRequest(`release/${releaseId}`);
      return result;
    } catch (error) {
      console.error('Error fetching release metadata:', error);
    }
  }
}

module.exports = MusicBrainzService;
