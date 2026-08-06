const User = require('../src/models/User');
const Address = require('../src/models/Address');



exports.editProfile = async (body, session) => {

    const { fullName, email, phoneNumber } = body;

    if (!session.user) {
        return {
            success: true,
            message: "Please sign in again"
        }
    }

    const id = session.user.id;

    if (fullName) {
        await User.updateOne({ _id: id }, { fullName });
    }

    if (phoneNumber) {
        await User.updateOne({ _id: id }, { phoneNumber });
    }

    if (email) {
        return {
            success: true,
            isEmail: true
        }
    }

    return {
        success: true,
        message: "Edited successfully"
    }
}


exports.verifyCurrentEmail = () => {

    function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    const otp = generateOTP();
    console.log("OTP:", otp);

    return {
        success: true,
        otp,
        otpExpiry: Date.now() + 3 * 60 * 1000
    }
}

exports.verifyOtp1 = (body, session) => {

    const enteredOTP = Object.values(body).join("");

    if (Date.now() > session.otpExpiry) {
        return {
            success: false,
            message: "OTP has expired`"
        }
    }

    if (enteredOTP !== session.otp) {
        return {
            success: false,
            message: "Entered OTP is invalid"
        }
    }

    return {
        success: true
    }
}


exports.verifyNewEmail = (body) => {

    const { email } = body;

    if (!email) {
        return {
            success: false,
            message: "Please enter your new email address"
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Please enter a valid email address"
        }
    }

    function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    const otp = generateOTP();
    console.log("OTP:", otp);

    return {
        success: true,
        email,
        otp,
        otpExpiry: Date.now() + 3 * 60 * 1000
    }
}


exports.verifyOtp2 = async (body, session) => {

    const enteredOTP = Object.values(body).join("");

    if (Date.now() > session.otpExpiry) {
        return {
            success: false,
            message: "OTP has expired`"
        }
    }

    if (enteredOTP !== session.otp) {
        return {
            success: false,
            message: "Entered OTP is invalid"
        }
    }

    await User.updateOne({ _id: session.user.id }, { email: session.email });

    delete session.email;
    delete session.otp;
    delete session.otpExpiry;

    return {
        success: true
    }
}


exports.addAddress = async (body) => {

    const { fullName, phoneNumber, pincode, houseName, locality, landmark, cityState } = body;

    if (!fullName || !phoneNumber || !pincode || !houseName || !locality || !cityState) {
        return {
            success: false,
            message: "Please fill in all the fields"
        }
    }

    await Address.create({
        fullName,
        phoneNumber,
        pincode,
        houseName,
        locality,
        landmark,
        cityState
    });

    return {
        success: true
    }
}


exports.editAddress = async (body, session, addressId) => {

    const { fullName, phoneNumber, pincode, houseName, locality, landmark, cityState } = body;

    if (Object.keys(body).length === 0) {
        return {
            success: false,
            message: "No changes were made"
        }
    }

    await Address.updateOne({ addressId, userId: session.user.id }, { $set: body });

    return {
        success: true
    }
}


exports.deleteAddress = async (addressId) => {

    await Address.deleteOne({ _id: addressId });

    return {
        success: true
    }
}