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
        path: 'image'
      }).populate({
        path: 'release',
        populate: {
          path: 'recording'
        }
      });

      const filteredReleaseGroups = releaseGroups.filter(releaseGroup => {
        const keepReleaseGroup = !releaseGroup.release.some(release =>
          release.recording.some(recording => {
            const shouldFilter = ['pending', 'rejected', 'disabled'].includes(recording.available);
            return shouldFilter;
          })
        );

        return keepReleaseGroup;
      });

      const result = filteredReleaseGroups.map(releaseGroup => {
        const {release, ...rest} = releaseGroup.toObject();
        return rest;
      });

      return {releaseGroup: result};
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

      return await releaseGroup.populate([
        {
          path: 'release',
          populate: {
            path: 'recording',
            populate: {
              path: 'image',
              select: '-fingerprint',
            },
          },
        },
        {
          path: 'image',
          select: '-fingerprint',
        },
      ]);

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

  async getTopAlbums(limit) {
    const topAlbums = await this.#calculateTopAlbums(limit);
    return topAlbums;
  }

  async #calculateTopAlbums(limit) {
    const topAlbums = await ReleaseGroup.aggregate([
      {$unwind: '$release'},
      {
        $lookup: {
          from: 'releases',
          localField: 'release',
          foreignField: '_id',
          as: 'releaseData',
        },
      },
      {$unwind: '$releaseData'},
      {
        $lookup: {
          from: 'recordings',
          localField: 'releaseData.recording',
          foreignField: '_id',
          as: 'recordingData',
        },
      },
      {$unwind: '$recordingData'},
      {
        $match: {
          'recordingData.available': 'available'
        }
      },
      {
        $group: {
          _id: '$_id',
          releaseGroup: {$first: '$$ROOT'},
          totalViews: {$sum: '$recordingData.view'},
        },
      },
      {
        $project: {
          'releaseGroup.releaseData': 0,
          'releaseGroup.recordingData': 0,
          '__v': 0,
        }
      },
      {$sort: {totalViews: -1}},
      {$limit: parseInt(limit)},
    ])

    let topReleaseGroup = [];

    for (const album of topAlbums) {
      topReleaseGroup.push(album.releaseGroup);
    }

    const populatedTopAlbums = await Promise.all(
      topReleaseGroup.map(async (album) => {
        const populatedAlbum = await ReleaseGroup.populate(album, {
          path: 'image',
        })
        return populatedAlbum;
      })
    );

    return populatedTopAlbums;
  }

  async getAlbumCount() {
    try {
      const albumCount = await ReleaseGroup.countDocuments();
      return albumCount;
    } catch (error) {
      console.error(`Error getting album count: ${error.message}`);
      throw new CustomError(500, 'Error getting album count.');
    }
  }
}

module.exports = ReleaseGroupService;
