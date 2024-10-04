const fs = require("fs");
const logger = require('./logging');

function initTempFolder() {
    const tempFolder = './temp';

    if (!fs.existsSync(tempFolder)) {
        logger.info('Temp folder does not exist, creating...');
        fs.mkdirSync(tempFolder);
    } else {
        logger.info('Temp folder exists');
    }
}

module.exports = initTempFolder;