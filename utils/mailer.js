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


module.exports = { sendOTP };