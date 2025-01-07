const nodemailer = require("nodemailer");
const UserService = require("../services/user");
const myEmail = process.env.EMAIL_USER
  ? process.env.EMAIL_USER
  : "muhammad.javed@emumba.com";
const myPassword = process.env.EMAIL_PASS
  ? process.env.EMAIL_PASS
  : "muhm uorr uizi mcom";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: myEmail,
    pass: myPassword,
  },
});

const sendVerificationEmail = async (user) => {
  const frontendUrl =
    process.env.NODE_ENV === "production"
      ? "https://emumba-okr-mvp.netlify.app"
      : "http://localhost:8888";
  const token = UserService.generateEmailVerificationToken(user);
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`; // Update URL to point to frontend

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Email Verification",
    text: `Please verify your email by clicking the following link: ${verificationUrl}`,
    html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
};
