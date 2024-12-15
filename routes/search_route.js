const router = require('express').Router();

const searchController = require('../controller/search_controller');

const {validateToken} = require('../middleware/jwt_handler');

router.post('/create-index', validateToken, searchController.createIndex);
router.get('/', validateToken, searchController.search);

module.exports = router;