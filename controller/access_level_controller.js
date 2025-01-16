const AccessLevelService = require('../services/access_level_service');

const asyncHandler = require('../middleware/async_handler');

class AccessLevelController {
  constructor() {
    this.accessLevelService = new AccessLevelService();
  }

  createAccessLevel = asyncHandler(async (req, res) => {
    await this.accessLevelService.createAccessLevel(req.body.name, req.body.privilege, req.body.accessLevel);
    res.status(201).json({status: 'ok', message: 'Access level created'});
  });
}

module.exports = new AccessLevelController();