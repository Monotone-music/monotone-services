const {promises: fs} = require("fs");
const crypto = require('crypto');
const logger = require('../init/logging');
const jwt = require('jsonwebtoken');
const CustomError = require("./custom_error");

const ensureTempDirectoryExists = async () => {
  const uploadDir = process.env.UPLOAD_DIR;
  try {
    await fs.access(uploadDir);
    logger.info('Directories already exist');
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        await fs.mkdir(uploadDir, {recursive: true});
        logger.info('Directories created successfully');
      } catch (createError) {
        logger.error('Error creating directories:', createError);
        throw createError;
      }
    } else {
      logger.error('Error checking directories:', error);
      throw error;
    }
  }
};

const calculateHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const sendResult = function sendResult(status, msg, data) {
  return {
    status: status,
    msg: msg,
    data: data
  }
}

module.exports = {
  ensureTempDirectoryExists,
  calculateHash,
  sendResult
}