const {promises: fs} = require("fs");
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

module.exports = {
  ensureTempDirectoryExists
}