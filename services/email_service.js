const nodemailer = require('nodemailer');
const {OAuth2Client} = require('google-auth-library');

const VerificationToken = require('../model/verification_token');
const CustomError = require("../utils/custom_error");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const EMAIL = process.env.GOOGLE_EMAIL;

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

oAuth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN
});

async function getAccessToken() {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    return accessToken;
  } catch (error) {
    throw new Error(`Error getting access token: ${error.message}`);
  }
}

async function sendEmail(emailAddress, accountId = null, emailType, paymentData = null, requestId = null, labelName = null, artistName = null) {
  const accessToken = await getAccessToken();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: EMAIL,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken,
    }
  });

  switch (emailType) {
    case 'verification':
      const verificationEmailOptions = await createVerificationEmailOptions(emailAddress, accountId);
      await transporter.sendMail(verificationEmailOptions);
      console.log('Verification email sent to: ', emailAddress);
      break;
    case 'payment':
      const paymentEmailOptions = await createPaymentEmailOptions(emailAddress, paymentData);
      await transporter.sendMail(paymentEmailOptions);
      console.log('Payment email sent to: ', emailAddress);
      break;
    case 'artist-approval':
      const applicationEmailOptions = await createArtistApprovalEmailOptions(emailAddress, requestId, labelName, artistName);
      await transporter.sendMail(applicationEmailOptions);
      console.log('Artist approval email sent to: ', emailAddress);
      break;
    case 'artist-rejection':
      const rejectionEmailOptions = await createArtistRejectionEmailOptions(emailAddress, requestId, labelName, artistName);
      await transporter.sendMail(rejectionEmailOptions);
      console.log('Artist rejection email sent to: ', emailAddress);
      break;
    default:
      throw new CustomError(400, 'Invalid email type');
  }
}

async function createPaymentEmailOptions(emailAddress, paymentData) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: paymentData.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(paymentData.amount / 100);

  return {
    from: process.env.GOOGLE_EMAIL,
    to: emailAddress,
    subject: 'Payment Confirmation',
    text: `Your payment of ${formattedAmount} has been confirmed. Receipt: ${paymentData.receiptUrl}`,
    html: `<p>Your payment of ${formattedAmount} has been confirmed. Receipt: <a href="${paymentData.receiptUrl}">${paymentData.receiptUrl}</a></p>`
  };
}

async function createVerificationEmailOptions(emailAddress, accountId) {
  const vericationToken = await generateVerificationToken(accountId);
  const verificationLink = `${process.env.FRONTEND_URL}/verification?token=${vericationToken.token}`;

  return {
    from: process.env.GOOGLE_EMAIL,
    to: emailAddress,
    subject: 'Verify Your Account',
    text: `
      Dear User,
      
      Thank you for creating an account with us. To complete your registration, please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This link is valid for a limited time. If you did not sign up for an account, you can safely ignore this email.
      
      Best regards,
      The Team
    `,
    html: `
      <p>Dear User,</p>
      <p>Thank you for creating an account with us. To complete your registration, please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}" style="color: #007bff; text-decoration: none;">Verify Your Account</a></p>
      <p>This link is valid for a limited time. If you did not sign up for an account, you can safely ignore this email.</p>
      <p>Best regards,</p>
      <p>The Team</p>
    `
  };
}


async function createArtistApprovalEmailOptions(emailAddress, requestId, labelName, artistName, approvalDate = new Date()) {
  const formattedApprovalDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(approvalDate);

  const approvalLink = `${process.env.FRONTEND_URL}/approval?artist=${requestId}`;

  return {
    from: process.env.GOOGLE_EMAIL,
    to: emailAddress,
    subject: 'Artist Approval Confirmation',
    text: `
      Dear ${artistName},
      
      Congratulations! Your collaboration request with ${labelName} has been approved as of ${formattedApprovalDate}.
      
      To finalize the decision and complete the approval process, please click the following link:
      ${approvalLink}
      
      If you have any questions, feel free to reach out to us.
      
      Best regards,
      The ${labelName} Team
    `,
    html: `
      <p>Dear <strong>${artistName}</strong>,</p>
      <p>Congratulations! Your collaboration request with <strong>${labelName}</strong> has been approved as of <strong>${formattedApprovalDate}</strong>.</p>
      <p>To finalize the decision and complete the approval process, please click the following link:</p>
      <p><a href="${approvalLink}" style="color: #007bff; text-decoration: none;">Finalize Approval</a></p>
      <p>If you have any questions, feel free to reach out to us.</p>
      <p>Best regards,</p>
      <p>The ${labelName} Team</p>
    `
  };
}

async function createArtistRejectionEmailOptions(emailAddress, requestId, labelName, artistName, rejectionDate = new Date()) {
  const formattedRejectionDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(rejectionDate);

  return {
    from: process.env.GOOGLE_EMAIL,
    to: emailAddress,
    subject: 'Artist Collaboration Rejection',
    text: `
      Dear ${artistName},
      
      We regret to inform you that your collaboration request with ${labelName} has been rejected as of ${formattedRejectionDate}.
      
      Thank you for your understanding, and we encourage you to apply for future opportunities.
      
      Best regards,
      The ${labelName} Team
    `,
    html: `
      <p>Dear <strong>${artistName}</strong>,</p>
      <p>We regret to inform you that your collaboration request with <strong>${labelName}</strong> has been rejected as of <strong>${formattedRejectionDate}</strong>.</p>
      <p>Thank you for your understanding, and we encourage you to apply for future opportunities.</p>
      <p>Best regards,</p>
      <p>The ${labelName} Team</p>
    `
  };
}

async function generateVerificationToken(accountId) {
  const verificationToken = new VerificationToken({account: accountId});
  await verificationToken.save();
  return verificationToken;
}

module.exports = {sendEmail};