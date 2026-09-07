const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendOTP = async (email, otp) => {

    await transporter.sendMail({
        from: `"voltiq" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your voltiq verification code",
        text: `Your voltiq verification code is ${otp}. It expires in 3 minutes.`
    });
}

const sendPasswordResetLink = async (email, resetLink) => {

    console.time("sendEmail");

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Your Password",
        html: `
        <h2>Password Reset</h2>
        <p> You requested to reset your password.</p>
        <p>Click the button below to create a new password:</p>
        <a href="${resetLink}">
                Reset Password
        </a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        `
    })

    console.timeEnd("sendEmail");
}


module.exports = { sendOTP, sendPasswordResetLink };