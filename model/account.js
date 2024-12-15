const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const option = require('./option');

const account = new mongoose.Schema({
  username: {
    type: String, required: true, minLength: 1, maxLength: 255
  },
  password: {
    type: String, required: true, minLength: 1, maxLength: 255,
  },
  isCredentialsChanged: {
    type: Boolean, default: false, required: false,
  },
  isDeleted: {
    type: Boolean, default: false, required: false,
  },
  status: {
    type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', required: false,
  },
  accessLevel: {type: mongoose.Types.ObjectId, ref: 'accessLevel', required: false},
}, option);

account.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

// hash the password
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

account.pre('findOneAndUpdate', async function (next) {
  const docToUpdate = this.getUpdate();
  if (docToUpdate.password) {
    const salt = await bcrypt.genSalt(12);
    docToUpdate.password = await bcrypt.hash(docToUpdate.password, salt);
  }
  next();
});

module.exports = mongoose.model('account', account);