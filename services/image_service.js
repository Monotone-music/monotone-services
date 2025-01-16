const Image = require('../model/image');

const MinioService = require('./minio_service');
const {calculateHash} = require('../utils/utils');

const {v4: uuidv4} = require('uuid');

class ImageService {
  constructor() {
    this.minioService = new MinioService();
  }

  /**
   * Upsert an image in the database
   * If the image exists, it returns the existing document. If not, it creates a new one.
   * @param {Object} image_data - The image data to upsert
   * @param {string} image_type - The type of the image
   * @returns {Object} The full image document, including _id and filename
   */
  async insertImage(image_data, image_type) {
    const data = {
      type: image_type,
      filename: image_data.filename || uuidv4(),
      mimetype: image_data.format,
      size: Buffer.byteLength(image_data.data),
      url: image_data.url,
      hash: calculateHash(image_data.data),
      dimensions: {
        width: image_data.width,
        height: image_data.height
      },
      buffer: image_data.data
    };

    let newImage;

    try {
      const existingImage = await Image.findOne({hash: data.hash});

      if (existingImage) {
        return existingImage;
      } else {
        newImage = await Image.create(data);
      }

      await this.minioService.uploadObject(data.buffer, data.filename, data.mimetype, 'monotone', 'images');
      return newImage;
    } catch (error) {
      console.error(`Error upserting Image: ${error.message}`);
      throw error;
    }
  }

  async getImage(image_name) {
    const imageInfo = await Image.findOne({filename: image_name});

    if (!imageInfo) {
      throw new Error('Image not found');
    }

    const image = await this.minioService.getObject(image_name, 'monotone', 'images');

    return image;
  }
}

module.exports = ImageService;