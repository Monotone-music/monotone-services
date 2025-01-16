const SearchService = require('../services/search_service');

const asyncHandler = require('../middleware/async_handler');

class SearchController {
  constructor() {
    this.searchService = new SearchService();
  }

  createIndex = asyncHandler(async (req, res) => {
    const result = await this.searchService.createIndex();
    res.status(200).json({status: 'ok', message: 'Index created', data: result});
  });

  search = asyncHandler(async (req, res) => {
    const query = req.query.q;
    const result = await this.searchService.search(query);
    res.status(200).json({status: 'ok', message: 'Search results', data: result});
  });
}

module.exports = new SearchController();