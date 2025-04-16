const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// SendGrid setup
const useSendGrid = (apiKey) => {
  sgMail.setApiKey(apiKey);
  
  return async (mailOptions) => {
    try {
      await sgMail.send(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }
  };
};

// SMTP setup (alternative)
const useSMTP = (config) => {
  const transporter = nodemailer.createTransport(config);
  
  return async (mailOptions) => {
    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }
  };
};

module.exports = { useSendGrid, useSMTP };