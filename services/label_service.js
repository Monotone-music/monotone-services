const Label = require('../model/label');
const CustomError = require("../utils/custom_error");

class LabelService {
  constructor() {
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
    return Label.find();
  }

  async getLabelById(labelId) {
    return Label.findById(labelId);
  }

  async appendReleaseGroupToLabel(accountId, items) {
    const itemsToAdd = Array.isArray(items) ? items : [items];

    console.log(accountId);

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