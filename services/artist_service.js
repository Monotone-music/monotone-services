const Artist = require('../model/artist');
const CustomError = require("../utils/custom_error");

class ArtistService {
  constructor() {
  }

  /**
   * Upsert an artist into the database.
   * If the artist exists, it returns the existing document. If not, it creates a new one.
   * @param {string} artistName - The name of the artist to upsert.
   * @returns {Promise<Object>} - The full artist document, including _id and name.
   * @throws {Error} - If there is an error during the upsert operation.
   */
  async upsertArtist(artistName) {
    try {
      let artistRecord = await Artist.findOneAndUpdate(
        {name: artistName},
        {name: artistName},
        {new: true, upsert: true}
      );
      return artistRecord;
    } catch (error) {
      console.error(`Error upserting artist: ${error.message}`);
      throw new Error('Failed to upsert artist.');
    }
  }

  /**
   * Upsert multiple artists into the database.
   * It will upsert each artist in the provided array of artist names.
   *
   * @param {Array<string>} artistNames - An array of artist names to upsert.
   * @returns {Promise<Array<Object>>} - An array of full artist documents (with _id and name).
   * @throws {Error} - If there is an error during the upsert operation.
   */
  async upsertMultipleArtists(artistNames) {
    try {
      const artistRecord = await Promise.all(
        artistNames.map((name) => this.upsertArtist(name))
      );
      return artistRecord;
    } catch (error) {
      console.error(`Error upserting multiple artists: ${error.message}`);
      throw new Error('Failed to upsert multiple artists.');
    }
  }

  async getAllArtists() {
    try {
      const artistRecords = await Artist.find().populate('image');
      const populatedArtistRecords = await Promise.all(
        artistRecords.map(async (artistRecord) => {
          return artistRecord;
        })
      );
      return {artists: populatedArtistRecords};
    } catch (error) {
      console.error(`Error getting all artists: ${error.message}`);
      throw new Error('Failed to get all artists.');
    }
  }

  async getArtistById(artistId) {
    try {
      const artist = await Artist.findOne({_id: artistId})
        .populate([
          {
            path: 'releaseGroup',
            populate: {
              path: 'image',
            },
          },
          {
            path: 'featuredIn',
            populate: {
              path: 'image',
            },
          },
          {path: 'image'},
        ]);

      return {artist: artist};
    } catch (error) {
      console.error(`Error getting artist by ID: ${error.message}`);
      throw new Error('Failed to get artist by ID.');
    }
  }

  async appendToArtistArray(artistId, field, items) {
    try {
      if (!['releaseGroup', 'featuredIn'].includes(field)) {
        throw new Error(`Invalid field "${field}". Allowed fields are 'releaseGroup' and 'featuredIn'.`);
      }

      const itemsToAdd = Array.isArray(items) ? items : [items];

      const updatedArtist = await Artist.findByIdAndUpdate(
        artistId,
        {$addToSet: {[field]: {$each: itemsToAdd}}},
        {new: true}
      );

      if (!updatedArtist) {
        throw new Error(`Artist with ID ${artistId} not found.`);
      }

      return updatedArtist;
    } catch (error) {
      console.error(`Error appending to artist array: ${error.message}`);
      throw new Error('Failed to append to artist array.');
    }
  }

  async updateArtistImage(artistId, imageId) {
    try {
      if (!artistId || !imageId) {
        throw new Error('Both artistId and imageId are required.');
      }

      const updatedArtist = await Artist.findByIdAndUpdate(artistId, {image: imageId}, {new: true});

      if (!updatedArtist) {
        throw new Error(`Artist with ID ${artistId} not found.`);
      }

      return updatedArtist;
    } catch (error) {
      console.error(`Error updating artist image: ${error.message}`);
      throw new CustomError('Failed to update artist image.');
    }
  }
}

module.exports = ArtistService;
