const ArtistLabelRequest = require('../model/artist_label_request');
const CustomError = require("../utils/custom_error");

class ArtistLabelRequestService {
  constructor() {
  }

  async getRequestByLabelId(labelId, status) {
    const requests = await ArtistLabelRequest.find({labelId: labelId, status: status})
      .populate('artistId');
    return requests;
  }

  async getLabelRequestStatistics(labelId) {
    const requests = await ArtistLabelRequest.find({labelId: labelId});
    const statistics = {
      pending: requests.filter(request => request.status === 'pending').length,
      noticed: requests.filter(request => request.status === 'noticed').length,
      approved: requests.filter(request => request.status === 'approved').length,
      rejected: requests.filter(request => request.status === 'rejected').length,
    };
    return statistics;
  }

  async getRequestByArtistId(artistId, status) {
    const requests = await ArtistLabelRequest.find({artistId: artistId, status: status})
      .populate('labelId');
    return requests;
  }

  async createArtistLabelRequest(artistId, labelId, artistEmail, filename) {
    const existingRequest = await ArtistLabelRequest.findOne({
      artistId,
      labelId,
      status: {$in: ['pending', 'approved']}
    });
    if (existingRequest) {
      throw new CustomError(409, 'A request for this artist and label already exists.');
    }

    const newRequest = new ArtistLabelRequest({
      artistId,
      labelId,
      artistEmail,
      file: filename,
    });

    return await newRequest.save();
  }

  async getRequestById(requestId) {
    const request = await ArtistLabelRequest.findOne({_id: requestId})
      .populate('artistId')
      .populate('labelId');
    return request;
  }

  async updateRequestStatus(requestId, status) {
    switch (status) {
      case 'approved':
        const updatedArtist = await ArtistLabelRequest.findOneAndUpdate({_id: requestId}, {status: 'approved'}, {new: true});

        await ArtistLabelRequest.deleteMany({artistId: updatedArtist.artistId, status: 'pending'});
        return true;
      case 'rejected':
        await ArtistLabelRequest.findOneAndUpdate({_id: requestId}, {status: 'rejected'}, {new: true});
        return false;
      default:
        throw new Error('Invalid status provided.');
    }
  }
}

module.exports = ArtistLabelRequestService;