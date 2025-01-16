const AccessLevel = require('../model/access_level');

class AccessLevelService {
  constructor() {
  }

  async createAccessLevel(name, privilege, accessLevel) {
    return await AccessLevel.create({name, privilege, accessLevel});
  }

  async getAccessLevelByLevel(level = 4) {
    return await AccessLevel.findOne({accessLevel: level});
  }
}

module.exports = AccessLevelService;