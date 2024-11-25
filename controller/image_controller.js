const ImageService = require('../services/image_service');

const asyncHandler = require('../middleware/async_handler');

class ImageController {
  constructor() {
    this.imageService = new ImageService();
  }

  getImage = asyncHandler(async (req, res) => {
    const imageId = req.params.imageId;

    try {
      const image = await this.imageService.getImage(imageId);

      if (!image) {
        return res.status(404).json({ status: 'error', message: 'Image not found' });
      }

      res.setHeader('Content-Type', image.mimetype);
      res.setHeader('Content-Length', image.fileSize);

      res.status(200).send(image.buffer);

    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to retrieve image', error: error.message });
    }
  });
}

module.exports = new ImageController();