const Artist = require('../model/artist');
const ViewLog = require('../model/view_log');
const mongoose = require('mongoose');
const ArtistLabelRequest = require('../model/artist_label_request');
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

  async createArtistViaRegistration(artistData) {
    try {
      const newArtist = new Artist(artistData);
      return await newArtist.save();
    } catch (error) {
      console.error(`Error creating artist via registration: ${error.message}`);
      throw new CustomError('Failed to create artist via registration.');
    }
  }

  async linkArtistWithLabel(artistId, labelId) {
    try {
      const updatedArtist = await Artist.findByIdAndUpdate(artistId, {labelId: labelId}, {new: true});
      if (!updatedArtist) {
        throw new Error(`Artist with ID ${artistId} not found.`);
      }
      return updatedArtist;
    } catch (error) {
      console.error(`Error linking artist with label: ${error.message}`);
      throw new Error('Failed to link artist with label.');
    }
  }

  async getArtistRecordings(artistId, status) {
    try {
      const artist = await Artist.findById(artistId)
        .populate({
          path: 'featuredIn',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
            },
          },
        })
        .populate({
          path: 'releaseGroup',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
            },
          },
        });

      if (!artist) {
        throw new Error('Artist not found');
      }

      const featuredInRecordings = artist.featuredIn.flatMap((featured) =>
        (featured.release || []).flatMap((release) =>
          (release.recording || []).filter(
            (recording) => recording && recording.available === status
          )
        )
      );

      const releaseGroupRecordings = artist.releaseGroup.flatMap((group) =>
        (group.release || []).flatMap((release) =>
          (release.recording || []).filter(
            (recording) => recording && recording.available === status
          )
        )
      );

      const allRecordings = [...featuredInRecordings, ...releaseGroupRecordings];

      return allRecordings;
    } catch (error) {
      console.error('Error fetching artist recordings:', error);
      throw new Error('Failed to fetch artist recordings');
    }
  }

  async getArtistStatistics(artistId) {
    try {
      const artist = await Artist.findById(artistId)
        .populate({
          path: 'featuredIn',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
            },
          },
        })
        .populate({
          path: 'releaseGroup',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
            },
          },
        })
        .populate({
          path: 'labelId'
        });

      if (!artist) {
        throw new Error('Artist not found');
      }

      const featuredRecordings = artist.featuredIn.flatMap((group) =>
        (group.release || []).flatMap((release) => release.recording || [])
      );

      const groupRecordings = artist.releaseGroup.flatMap((group) =>
        (group.release || []).flatMap((release) => release.recording || [])
      );

      const allRecordings = [...featuredRecordings, ...groupRecordings];
      const uniqueRecordings = Array.from(
        new Map(allRecordings.map((rec) => [rec._id.toString(), rec])).values()
      );

      const totalViews = uniqueRecordings.reduce((sum, recording) => sum + (recording.view || 0), 0);

      return {
        totalViews: totalViews,
        totalRecordings: uniqueRecordings.length,
        label: artist.labelId.displayName,
      };
    } catch (error) {
      console.error('Error fetching artist statistics:', error);
      throw new Error('Failed to fetch artist statistics');
    }
  }

  async getMonthlyArtistViews(artistId) {
    try {
      const artist = await Artist.findById(artistId)
        .populate({
          path: 'featuredIn',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
            },
          },
        })
        .populate({
          path: 'releaseGroup',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
            },
          },
        });

      if (!artist) {
        throw new Error('Artist not found');
      }

      const featuredRecordings = artist.featuredIn.flatMap((group) =>
        group.release.flatMap((release) => release.recording)
      );
      const groupRecordings = artist.releaseGroup.flatMap((group) =>
        group.release.flatMap((release) => release.recording)
      );
      const recordingIds = Array.from(
        new Set([...featuredRecordings, ...groupRecordings].map((rec) => rec._id.toString()))
      );

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const viewLogs = await ViewLog.aggregate([
        {
          $match: {
            recording: {$in: recordingIds.map((id) => new mongoose.Types.ObjectId(id))},
            updatedAt: {$gte: sixMonthsAgo},
          },
        },
        {
          $group: {
            _id: {
              year: {$year: '$updatedAt'},
              month: {$month: '$updatedAt'},
            },
            totalViews: {$sum: '$count'},
          },
        },
        {
          $sort: {'_id.year': 1, '_id.month': 1},
        },
      ]);

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];

      const formattedViews = viewLogs.map((log) => ({
        month: `${monthNames[log._id.month - 1]} ${log._id.year}`,
        views: log.totalViews,
      })).sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');

        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);

        return dateA - dateB;
      });

      return formattedViews;
    } catch (error) {
      console.error('Error fetching monthly views:', error);
      throw new Error('Failed to fetch monthly view count for the artist');
    }
  }

  async getTopTracks(artistId) {
    try {
      const artist = await Artist.findById(artistId)
        .populate({
          path: 'featuredIn',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
              select: 'title view duration',
            },
          },
        })
        .populate({
          path: 'releaseGroup',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
              select: 'title view duration',
            },
          },
        });

      if (!artist) {
        throw new Error('Artist not found');
      }

      const featuredRecordings = artist.featuredIn.flatMap((group) =>
        group.release.flatMap((release) => release.recording)
      );
      const groupRecordings = artist.releaseGroup.flatMap((group) =>
        group.release.flatMap((release) => release.recording)
      );

      const allRecordings = Array.from(
        new Set([...featuredRecordings, ...groupRecordings].map((rec) => rec._id.toString()))
      ).map((id) =>
        [...featuredRecordings, ...groupRecordings].find((rec) => rec._id.toString() === id)
      );

      const topTracks = allRecordings
        .filter((recording) => recording && recording.view !== undefined) // Skip empty or undefined recordings
        .sort((a, b) => b.view - a.view) // Sort by views in descending order
        .slice(0, 5); // Limit to top 5

      return topTracks.map((track) => ({
        _id: track._id,
        title: track.title,
        duration: track.duration,
        totalViews: track.view,
      }));
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      throw new Error('Failed to fetch top tracks for the artist');
    }
  }

  async getEstimatedEarnings(artistId) {
    try {
      const artist = await Artist.findById(artistId)
        .populate({
          path: 'featuredIn',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
              select: '_id title view',
            },
          },
        })
        .populate({
          path: 'releaseGroup',
          populate: {
            path: 'release',
            populate: {
              path: 'recording',
              select: '_id title view',
            },
          },
        });

      if (!artist) {
        throw new Error('Artist not found');
      }

      const featuredRecordings = artist.featuredIn.flatMap((group) =>
        group.release.flatMap((release) => release.recording)
      );
      const groupRecordings = artist.releaseGroup.flatMap((group) =>
        group.release.flatMap((release) => release.recording)
      );

      const allRecordings = Array.from(
        new Set([...featuredRecordings, ...groupRecordings].map((rec) => rec._id.toString()))
      ).map((id) =>
        [...featuredRecordings, ...groupRecordings].find((rec) => rec._id.toString() === id)
      );

      const firstDayOfThisMonth = new Date();
      firstDayOfThisMonth.setDate(1);
      firstDayOfThisMonth.setHours(0, 0, 0, 0);

      const lastDayOfThisMonth = new Date(firstDayOfThisMonth);
      lastDayOfThisMonth.setMonth(lastDayOfThisMonth.getMonth() + 1);
      lastDayOfThisMonth.setDate(0); // Get the last day of the current month
      lastDayOfThisMonth.setHours(23, 59, 59, 999);

      const viewLogs = await ViewLog.aggregate([
        {
          $match: {
            recording: {$in: allRecordings.map((rec) => new mongoose.Types.ObjectId(rec._id))},
            updatedAt: {$gte: firstDayOfThisMonth, $lte: lastDayOfThisMonth},
          },
        },
        {
          $group: {
            _id: '$recording',
            totalViews: {$sum: '$count'},
          },
        },
      ]);

      const totalViewsThisMonth = viewLogs.reduce((sum, log) => sum + log.totalViews, 0);

      const estimatedPayout = totalViewsThisMonth * 0.005;

      return estimatedPayout;
    } catch (error) {
      console.error('Error calculating estimated payout:', error);
      throw new Error('Failed to calculate the estimated payout for this month');
    }
  }

  async getArtistByAccountId(accountId) {
    const artist = await Artist.findOne({account: accountId})
      .populate({path: 'account', select: 'email'})
      .populate({path: 'labelId', select: 'displayName'})
      .populate({path: 'image', select: 'filename'});
    if (!artist) {
      throw new CustomError(404, 'Artist not found');
    }
    return artist;
  }
}

module.exports = ArtistService;
