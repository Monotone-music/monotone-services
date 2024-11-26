const AccountService = require('../services/account_service');

const asyncHandler = require('../middleware/async_handler');

class AccountController {
  constructor() {
    this.accountService = new AccountService();
  }

  createAccount = asyncHandler(async (req, res) => {
    await this.accountService.createAccount(req.body);
    res.status(201).json({status: 'ok', message: 'Account created'});
  });

}

module.exports = new AccountController();