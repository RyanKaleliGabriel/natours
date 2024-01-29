const nodemailer = require('nodemailer');

// new Email(user, url).sendWelcome();

module.exports = class Email {
  constructor (user, url) {
    this.to = user.email
    this.firstName = user.name.split('')[0]
    this.url = url
    this.from = `Ryan Kaleli <${process.env.EMAIL_FROM}>`
  }

  createTransport() {
    
  }
}

const sendEmail = async options => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Ryan Kaleli <ryan@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail
