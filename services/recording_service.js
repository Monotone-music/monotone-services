const MinioService = require('./minio_service');
const mm = require("music-metadata");
const util = require("util");

class RecordingService {
  constructor() {
    this.minioService = new MinioService();
  }

  async putRecording(buffer, ext) {
    await (async () => {
      try {
        const metadata = await mm.parseBuffer(buffer, ext);
        console.log(metadata);
        const {common} = metadata;
        //recording data
        let recording_title = common.title;
        let recording_duration = format.duration;

        //release group data
        let artists = common.artists
        let artist = common.artist;


        // console.log(util.inspect(metadata, {showHidden: false, depth: null}));
      } catch (error) {
        console.error(error.message);
      }
    })();
  }
}

module.exports = RecordingService;