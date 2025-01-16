const Label = require('../model/label');
const CustomError = require("../utils/custom_error");

const ViewLogService = require('./view_log_service');

class LabelService {
  constructor() {
    this.viewLogService = new ViewLogService();
  }

  async createLabel(labelData) {
    const label = new Label({
      displayName: labelData.displayName,
      email: labelData.email,
      account: labelData.account,
      releaseGroup: labelData.releaseGroup,
    });
    return label.save();
  }

  async getAllLabels() {
    return await Label.find({displayName: {$ne: "defaultlabel"}}, {account: 0, releaseGroup: 0});
  }

  async getLabelById(labelId) {
    return Label.findById(labelId);
  }

  async appendReleaseGroupToLabel(accountId, items) {
    const itemsToAdd = Array.isArray(items) ? items : [items];

    const updatedLabel = await Label.findOneAndUpdate(
      {account: accountId},
      {$addToSet: {releaseGroup: {$each: itemsToAdd}}},
      {new: true}
    )

    if (!updatedLabel) {
      throw new CustomError(404, `Label with ID ${accountId} not found.`);
    }

    return updatedLabel;
  }

  async getTotalLabelTracks(labelId) {
    const label = await Label.findById(labelId);

    if (!label) {
      throw new CustomError(404, `Label with ID ${labelId} not found.`);
    }

    const result = await Label.aggregate([
      {$match: {_id: label._id}},
      {
        $lookup: {
          from: 'releasegroups',
          localField: 'releaseGroup',
          foreignField: '_id',
          as: 'releaseGroup',
        },
      },
      {$unwind: '$releaseGroup'},
      {
        $lookup: {
          from: 'releases',
          localField: 'releaseGroup.release',
          foreignField: '_id',
          as: 'release',
        },
      },
      {$unwind: '$release'},
      {
        $lookup: {
          from: 'recordings',
          localField: 'release.recording',
          foreignField: '_id',
          as: 'recording',
        },
      },
      {$unwind: '$recording'},
      {
        $facet: {
          statusCount: [
            {
              $group: {
                _id: '$recording.available',
                count: {$sum: 1},
              },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
              },
            },
          ],
          top10: [
            {$sort: {'recording.view': -1}},
            {$limit: 10},
            {
              $lookup: {
                from: 'images',
                localField: 'recording.image',
                foreignField: '_id',
                as: 'image',
              },
            },
            {
              $unwind: {
                path: '$image',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: '$recording._id',
                title: '$recording.title',
                view: '$recording.view',
                artist: '$recording.displayedArtist',
                image: '$image',
                status: '$recording.available',
              },
            },
          ],
          totalViews: [
            {
              $group: {
                _id: null,
                totalViews: {$sum: '$recording.view'}
              }
            },
            {
              $project: {
                _id: 0,
                totalViews: 1
              }
            }
          ]
        },
      },
    ]);

    const recordingCount = {
      reject: 0,
      pending: 0,
      available: 0,
    };

    if (result.length > 0) {
      const statusCount = result[0].statusCount;

      statusCount.forEach(item => {
        if (recordingCount[item.status] !== undefined) {
          recordingCount[item.status] = item.count || 0;
        }
      });

      return {
        recordingCount,
        top10: result[0].top10,
        totalViews: result[0].totalViews[0].totalViews,
      };
    }

    return {
      recordingCount,
      top10: [],
      totalViews: 0,
    };
  }

  async getRecordingsByStatusFromLabel(labelId, recordingStatus) {
    const label = await Label.findById(labelId);

    if (!label) {
      throw new CustomError(404, `Label with ID ${labelId} not found.`);
    }

    return await this.aggregateRecordingsByType(label, recordingStatus);
  }

  async aggregateRecordingsByType(label, recordingStatus) {
    const statusFilter = recordingStatus === 'available'
      ? {$or: [{'recording.available': 'available'}, {'recording.available': 'disabled'}]}
      : {'recording.available': recordingStatus};

    const recordings = await Label.aggregate([
      {$match: {_id: label._id}},
      {
        $lookup: {
          from: 'releasegroups',
          localField: 'releaseGroup',
          foreignField: '_id',
          as: 'releaseGroup',
        },
      },
      {$unwind: '$releaseGroup'},
      {
        $lookup: {
          from: 'releases',
          localField: 'releaseGroup.release',
          foreignField: '_id',
          as: 'release',
        }
      },
      {$unwind: '$release'},
      {
        $lookup: {
          from: 'recordings',
          localField: 'release.recording',
          foreignField: '_id',
          as: 'recording'
        },
      },
      {$unwind: '$recording'},
      {
        $lookup: {
          from: 'images',
          localField: 'recording.image',
          foreignField: '_id',
          as: 'image',
        },
      },
      {$unwind: '$image'},
      {
        $lookup: {
          from: 'media',
          localField: 'recording.media',
          foreignField: '_id',
          as: 'media',
        },
      },
      {$unwind: '$media'},
      {$match: statusFilter},
      {
        $project: {
          _id: '$recording._id',
          title: '$recording.title',
          view: '$recording.view',
          artist: '$recording.displayedArtist',
          status: '$recording.available',
          image: '$image',
          media: {
            _id: '$media._id',
            filename: '$media.filename',
            originalName: '$media.originalName',
            extension: '$media.extension',
            size: '$media.size',
            mimetype: '$media.mimetype',
            fingerprint: {
              duration: '$media.fingerprint.duration',
            },
            hash: '$media.hash',
          },
        }
      }
    ]);

    return recordings;
  }

  async getLabelViewLast6Month(labelId) {
    const label = await Label.findById(labelId);

    if (!label) {
      throw new CustomError(404, `Label with ID ${labelId} not found.`);
    }

    const viewsLast6Months = await this.viewLogService.getViewsForLast6Months();

    const result = await Label.aggregate([
      {$match: {_id: label._id}},
      {
        $lookup: {
          from: 'releasegroups',
          localField: 'releaseGroup',
          foreignField: '_id',
          as: 'releaseGroup'
        },
      },
      {$unwind: '$releaseGroup'},
      {
        $lookup: {
          from: 'releases',
          localField: 'releaseGroup.release',
          foreignField: '_id',
          as: 'release'
        },
      },
      {$unwind: '$release'},
      {
        $lookup: {
          from: 'recordings',
          localField: 'release.recording',
          foreignField: '_id',
          as: 'recording'
        },
      },
      {$unwind: '$recording'},
      {
        $project: {
          _id: 0,
          recordingId: '$recording._id',
        }
      }
    ])

    const labelRecordingIds = result.map(item => item.recordingId.toString());

    const monthlyViewSums = {};
    for (const [month, views] of Object.entries(viewsLast6Months)) {
      monthlyViewSums[month] = views
        .filter(view => labelRecordingIds.includes(view.recordingId.toString()))
        .reduce((sum, view) => sum + view.count, 0);
    }

    return monthlyViewSums;
  }

  async getLabelFromAccountId(accountId) {
    return Label.findOne({account: accountId});
  }

  async updateLabelImage(labelId, imageId) {
    const label = await Label.findById(labelId);

    if (!label) {
      throw new CustomError(404, `Label with ID ${labelId} not found.`);
    }

    label.image = imageId;
    return label.save();
  }
}

module.exports = LabelService;