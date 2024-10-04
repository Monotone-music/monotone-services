const normalizePath = (filePath) => {
    return filePath.replace(/\s/g, '\\ ');
};

module.exports = {
    normalizePath
}