const ElasticService = require('./elastic_service');
const ArtistService = require('./artist_service');
const RecordingService = require('./recording_service');
const ReleaseGroupService = require('./release_group_service');

class SearchService {
  constructor() {
    this.elasticService = new ElasticService();
    this.artistService = new ArtistService();
    this.recordingService = new RecordingService();
    this.releaseGroupService = new ReleaseGroupService();
  }

  async search(query) {
    try {
      const result = await this.elasticService.searchDocument(query);

      if (!result || Object.entries(result).length === 0) {
        console.log('No results found.');
        return {};
      }

      for (const key in result) {
        result[key] = await Promise.all(
          result[key].map(async (item) => {
            const source = {...item.source};
            switch (source.type) {
              case 'recording':
                // console.log('Processing recording:');
                // console.log(`ID: ${item.id}, Value: ${source.value}, Score: ${item.score}`);
                const recordingInfo = await this.recordingService.getRecordingById(source.objectId);
                source.info = recordingInfo;
                delete source.objectId;
                break;

              case 'artist':
                // console.log('Processing artist:');
                // console.log(`ID: ${item.id}, Value: ${source.value}, Score: ${item.score}`);
                const artistInfo = await this.artistService.getArtistById(source.objectId);
                source.info = artistInfo;
                delete source.objectId;
                break;

              case 'album':
              case 'single':
              case 'compilation':
                // console.log('Processing release group:');
                // console.log(`ID: ${item.id}, Value: ${source.value}, Score: ${item.score}`);
                const releaseGroupInfo = await this.releaseGroupService.getReleaseGroupGeneralInfoById(source.objectId);
                source.info = releaseGroupInfo;
                delete source.objectId;
                break;

              default:
                console.log('Unknown type:');
                console.log(`ID: ${item.id}, Type: ${source.type}`);
            }

            return {...item, source};
          })
        );
      }

      return result;
    } catch (error) {
      console.error('Error in search:', error);
      throw new Error('Search failed. Please try again later.');
    }
  }


  async createIndex() {
    return await this.elasticService.createSearchIndex();
  }
}

module.exports = SearchService;