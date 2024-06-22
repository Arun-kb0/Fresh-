const nodeMailer = require('nodemailer')

// * nodemailer transport
const nodeMailerTransporter = nodeMailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
})

module.exports = {
  nodeMailerTransporter
}
