const bcrypt = require('bcrypt')
const otpVerificationModal = require('../model/otpVerificationModal')
const { nodeMailerTransporter } = require('../config/nodeMailerConfig')



// * send otp function
const sendOtpToEmail = async ({ email, name, password }) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`
    const html = `
    <table style="background-color: #222; color: whitesmoke; display: flex; flex-direction: column; align-items: center; justify-content: center;" >
    <ul>
    <ul><h3 style="color:orange;">Fresh</h3> </ul>
    <ul><h1>${otp}</h1></ul>
    <ul><p>to verify your email address and complete signup to Fresh</p></ul>
    <ul><p>This code will expire after 5 minutes</p></ul>
    </tbody>
    </table>
    `
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "verify email",
      html: html
    }
    const hashedOtp = await bcrypt.hash(otp, 10)
    const newOtpVerification = await otpVerificationModal.create({
      username: email,
      name,
      password,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1 * 60 * 1000
    })
    
    await nodeMailerTransporter.sendMail(mailOptions)
    return ({
      status: "pending",
      message: "Verify otp in email",
      data: {
        _id: newOtpVerification._id,
        username: email,
      }
    })
  } catch (error) {
    return ({
      status: "failed",
      message: error.message
    })
  }
}


module.exports = {
  sendOtpToEmail
}