const client = require('../init/init_elastic_engine');

class ElasticService {
  constructor() {
  }

  async createSearchIndex() {
    try {
      const result = await client.indices.create({
        index: 'music-lib',
        body: {
          mappings: {
            properties: {
              value: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                  reading: {
                    type: 'text',
                    analyzer: 'romaji_analyzer',
                    search_analyzer: 'standard'
                  },
                  japanese: {
                    type: 'text',
                    analyzer: 'kuromoji_analyzer'
                  }
                }
              },
              type: { type: 'keyword' },
              objectId: { type: 'keyword' },
              created_at: { type: 'date' }
            }
          },
          settings: {
            analysis: {
              analyzer: {
                kuromoji_analyzer: {
                  type: 'custom',
                  tokenizer: 'kuromoji_tokenizer',
                  filter: [
                    'kuromoji_baseform',
                    'kuromoji_stemmer',
                    'lowercase'
                  ]
                },
                romaji_analyzer: {
                  type: 'custom',
                  tokenizer: 'kuromoji_tokenizer',
                  filter: [
                    'kuromoji_baseform',
                    'lowercase'
                  ]
                }
              }
            }
          }
        }
      });
      return result;
    } catch (error) {
      if (error.meta?.body?.error?.type === 'resource_already_exists_exception') {
        console.log('Index already exists');
      } else {
        console.error('Error creating index:', error);
      }
    }
  }


  async addDocument(value, type, objectId) {
    try {
      const existingDoc = await client.search({
        index: 'music-lib',
        body: {
          query: {
            bool: {
              must: [
                {term: {type: type}},
                {term: {"value.keyword": value}}
              ]
            }
          }
        },
      });

      if (existingDoc.hits.hits.length > 0) {
        return {
          success: false,
          message: 'Document already exists',
          existingId: existingDoc.hits.hits[0]._id
        };
      }

      // Use optimistic concurrency control
      const result = await client.index({
        index: 'music-lib',
        body: {
          value: value,
          type: type,
          objectId: objectId,
          created_at: new Date()
        },
        refresh: 'true',
      });

      return {
        success: true,
        message: 'Document added successfully',
        newId: result._id
      };

    } catch (error) {
      if (error.meta?.statusCode === 409) {
        return {
          success: false,
          message: 'Document already exists (concurrent write detected)',
          error: error.message
        };
      }

      console.error('Error adding document:', error);
      return {
        success: false,
        message: 'Error adding document',
        error: error.message
      };
    }
  }

  async searchDocument(query) {
    try {
      const result = await client.search({
        index: 'music-lib',
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ['value'],
              fuzziness: 'AUTO',
              max_expansions: 50,
              prefix_length: 0
            }
          }
        }
      });

      const hits = result.hits.hits;

      // Group results by type
      const groupedResults = hits.reduce((acc, hit) => {
        const type = hit._source.type;
        if (!acc[type]) {
          acc[type] = [];
        }

        acc[type].push({
          id: hit._id,
          score: hit._score,
          source: hit._source,
        });

        return acc;
      }, {});

      return groupedResults;
    } catch (error) {
      console.error('Error searching document:', error);
      throw error;
    }
  }
}

module.exports = ElasticService;