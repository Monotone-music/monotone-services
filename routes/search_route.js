const router = require('express').Router();

const searchController = require('../controller/search_controller');

router.post('/create-index', searchController.createIndex);
router.get('/', searchController.search);

module.exports = router;