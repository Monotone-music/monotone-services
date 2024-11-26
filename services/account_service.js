const account = require('../model/account');
const CustomError = require("../utils/custom_error");
const validator = require('validator');

class AccountService {
  constructor() {
  }

  async createAccount(body) {
    const sanitizedBody = {
      username: validator.trim(validator.escape(body.username || '')),
      email: validator.trim(validator.normalizeEmail(body.email || '')),
      password: body.password
    };

    const dupeAccount = await account.findOne({
      $or: [
        {username: sanitizedBody.username},
        {email: sanitizedBody.email}
      ]
    })

    if (dupeAccount) {
      throw new CustomError(400, 'Account already exists');
    }

    const newAccount = new account(sanitizedBody);
    await newAccount.save();
  }

  async getAccountByUsername(username) {
    return await account.findOne({username: username});
  }
}

module.exports = AccountService;