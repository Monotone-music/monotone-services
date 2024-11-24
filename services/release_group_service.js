const ReleaseGroup = require('../model/release_group');

const CustomError = require("../utils/custom_error");

class ReleaseGroupService {
  constructor() {
  }

  /**
   * Upserts a ReleaseGroup and then updates it with the new Release if needed
   * @param {Object} releaseGroup_data - Data for the ReleaseGroup
   * @returns {Object} The upserted ReleaseGroup with updated releases
   */
  async upsertReleaseGroup(releaseGroup_data) {
    try {
      let data = {
        title: releaseGroup_data.title,
        releaseType: releaseGroup_data.releaseType,
        releaseEvent: releaseGroup_data.releaseEvent,
        albumArtist: releaseGroup_data.albumArtist,
        mbid: releaseGroup_data.mbid,
      };

      const releaseGroup = await ReleaseGroup.findOneAndUpdate(
        {mbid: releaseGroup_data.mbid},
        {$set: data},
        {new: true, upsert: true}
      );

      return releaseGroup;
    } catch (error) {
      console.error(`Error upserting ReleaseGroup: ${error.message}`);
      throw error;
    }
  }

  async getAllReleaseGroups() {
    try {
      const releaseGroups = await ReleaseGroup.find().populate({
        path: 'image',
      });

      return {releaseGroup: releaseGroups,};
    } catch (error) {
      console.error(`Error getting all ReleaseGroups: ${error.message}`);
      throw error;
    }
  }

  async getReleaseGroupByID(releaseGroupID) {
    try {
      const releaseGroup = await ReleaseGroup.findById(releaseGroupID);

      if (!releaseGroup) {
        console.error(`ReleaseGroup with ID ${releaseGroupID} not found.`);
        throw new CustomError(404, 'ReleaseGroup not found.');
      }

      return await releaseGroup.populate({
        path: 'release',
        populate: {
          path: 'recording',
          populate: {
            path: 'image',
            select: '-fingerprint'
          }
        }
      });

    } catch (error) {
      console.error(`Error getting ReleaseGroup by ID: ${error.message}`);
      throw error;
    }
  }

  async getReleaseGroupGeneralInfoById(releaseGroupID) {
    try {
      const releaseGroup = ReleaseGroup.findById(releaseGroupID)
        .populate({
          path: 'image',
        });

      if (!releaseGroup) {
        console.error(`ReleaseGroup with ID ${releaseGroupID} not found.`);
        throw new CustomError(404, 'ReleaseGroup not found.');
      }

      return releaseGroup;
    } catch (error) {
      console.error(`Error getting ReleaseGroup by ID: ${error.message}`);
    }
  }

  async updateReleaseGroupImage(releaseGroupID, imageID) {
    try {
      if (!releaseGroupID || !imageID) {
        throw new Error('Both releaseGroupID and imageID are required.');
      }

      const releaseGroup = await ReleaseGroup.findById(releaseGroupID);

      if (!releaseGroup) {
        throw new Error(`Release group with ID ${releaseGroupID} not found.`);
      }

      if (!releaseGroup.image) {
        releaseGroup.image = imageID;
        const updatedReleaseGroup = await releaseGroup.save();
        return updatedReleaseGroup;
      }

      return releaseGroup;
    } catch (error) {
      console.error(`Error in lazy updating release group image: ${error.message}`);
      throw new Error('Failed to perform lazy update of release group image.');
    }
  }


  async appendToReleaseGroupArray(releaseGroupID, field, items) {
    try {
      if (!['release'].includes(field)) {
        throw new Error(`Invalid field "${field}". Allowed fields are 'release'.`);
      }

      const itemsToAdd = Array.isArray(items) ? items : [items];

      const updatedReleaseGroup = await ReleaseGroup.findByIdAndUpdate(
        releaseGroupID,
        {$addToSet: {[field]: {$each: itemsToAdd}}},
        {new: true}
      );

      if (!updatedReleaseGroup) {
        throw new Error(`Artist with ID ${releaseGroupID} not found.`);
      }

      return updatedReleaseGroup;
    } catch (error) {
      console.error(`Error appending to ReleaseGroup array: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ReleaseGroupService;
