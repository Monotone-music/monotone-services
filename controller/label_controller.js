const LabelService = require('../services/label_service');
const ArtistService = require("../services/artist_service");
const ArtistLabelRequestService = require("../services/artist_label_request_service");

const {sendEmail} = require('../services/email_service');

const TokenService = require('../services/token_service');

const asyncHandler = require('../middleware/async_handler');
const CustomError = require("../utils/custom_error");
const {join} = require("node:path");
const fs = require('fs');

class LabelController {
  constructor() {
    this.labelService = new LabelService();
    this.artistService = new ArtistService();
    this.artistLabelRequestService = new ArtistLabelRequestService();
    this.tokenService = new TokenService();
  }

  getAvailableTracks = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const labelId = await this.labelService.getLabelFromAccountId(accountId);

    const tracks = await this.labelService.getRecordingsByStatusFromLabel(labelId, 'available');
    res.status(200).json({status: 'ok', message: 'Pending tracks retrieved', data: tracks});
  });

  getPendingTracks = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const labelId = await this.labelService.getLabelFromAccountId(accountId);

    const tracks = await this.labelService.getRecordingsByStatusFromLabel(labelId, 'pending');
    res.status(200).json({status: 'ok', message: 'Pending tracks retrieved', data: tracks});
  });

  getRejectedTracks = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const labelId = await this.labelService.getLabelFromAccountId(accountId);

    const tracks = await this.labelService.getRecordingsByStatusFromLabel(labelId, 'rejected');
    res.status(200).json({status: 'ok', message: 'Rejected tracks retrieved', data: tracks});
  });

  getQueuedTracks = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const labelId = await this.labelService.getLabelFromAccountId(accountId);

    const tracks = await this.labelService.getRecordingsByStatusFromLabel(labelId, 'queued');
    res.status(200).json({status: 'ok', message: 'Queued tracks retrieved', data: tracks});
  });

  getLabelViewsLast6Months = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const labelId = await this.labelService.getLabelFromAccountId(accountId);

    const views = await this.labelService.getLabelViewLast6Month(labelId);
    res.status(200).json({status: 'ok', message: 'Label views retrieved', data: views});
  });

  serveDocument = asyncHandler(async (req, res) => {
    const filename = req.params.file;

    const filePath = join(process.cwd(), 'tmp/uploads/documents', filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`File not found: ${filePath}`);
        return res.status(404).json({error: 'File not found'});
      }

      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`Error serving file: ${err.message}`);
          return res.status(500).json({error: 'Error serving file'});
        }
      });
    });
  });

  sendApprovalEmail = asyncHandler(async (req, res) => {
    const requestId = req.params.request;

    const request = await this.artistLabelRequestService.getRequestById(requestId);

    const artistName = request.artistId.name;
    const labelName = request.labelId.displayName;
    const artistEmail = request.artistEmail;

    await sendEmail(artistEmail, null, "artist-approval", null, requestId, labelName, artistName);

    res.status(200).json({status: 'ok', message: 'Email sent'});
  });

  sendRejectionEmail = asyncHandler(async (req, res) => {
    const requestId = req.params.request;

    const request = await this.artistLabelRequestService.getRequestById(requestId);

    const artistName = request.artistId.name;
    const labelName = request.labelId.displayName;
    const artistEmail = request.artistEmail;

    await sendEmail(artistEmail, null, "artist-rejection", null, requestId, labelName, artistName);
    await this.artistLabelRequestService.updateRequestStatus(requestId, 'rejected');

    res.status(200).json({status: 'ok', message: 'Email sent'});
  });

  getAllLabels = asyncHandler(async (req, res) => {
    const labels = await this.labelService.getAllLabels();

    res.status(200).json({status: 'ok', message: 'Labels retrieved', data: labels});
  });

  getAllRequests = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const labelId = await this.labelService.getLabelFromAccountId(accountId);

    const status = req.params.status;

    const requests = await this.artistLabelRequestService.getRequestByLabelId(labelId, status);
    res.status(200).json({status: 'ok', message: 'Requests retrieved', data: requests});
  });

  getLabelRequestStatistics = asyncHandler(async (req, res) => {
    const accountId = await this.#extractAccountIdFromAccessToken(req);
    const labelId = await this.labelService.getLabelFromAccountId(accountId);

    const statistics = await this.artistLabelRequestService.getLabelRequestStatistics(labelId);
    res.status(200).json({status: 'ok', message: 'Statistics retrieved', data: statistics});
  });

  async #extractAccountIdFromAccessToken(req) {
    const preflightToken = req.header('Authorization')
    let accessToken;
    if (!preflightToken?.startsWith('Bearer ')) {
      throw new CustomError(401, 'Access denied. No token provided');
    } else {
      accessToken = preflightToken.split(' ')[1];
    }

    const accountId = await this.tokenService.getAccountIdFromToken(accessToken);
    return accountId;
  }
}

module.exports = new LabelController();