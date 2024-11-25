const {promises: fs} = require("fs");
const crypto = require('crypto');
const logger = require('../init/logging');

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

const parseRange = (rangeHeader, fileSize) => {
  const [start, end] = rangeHeader.replace(/bytes=/, '').split('-');
  return {
    start: parseInt(start, 10),
    end: end ? parseInt(end, 10) : fileSize - 1
  };
};

module.exports = {
  ensureTempDirectoryExists,
  calculateHash,
  parseRange
}