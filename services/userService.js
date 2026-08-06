const User = require('../src/models/User');
const Address = require('../src/models/Address');

const bcrypt = require('bcrypt');



exports.editProfile = async (body, session) => {

    const { fullName, email, phoneNumber } = body;

    const id = session.user.id;

    const user = await User.findById(id);

    if (fullName !== user.fullName) {
        await User.updateOne({ _id: id }, { fullName });
    }

    if (phoneNumber !== user.phoneNumber) {
        await User.updateOne({ _id: id }, { phoneNumber });
    }

    if (email !== user.email) {
        session.newEmail = email;
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


exports.verifyNewEmail = (body, session) => {

    function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    const otp = generateOTP();
    console.log("OTP:", otp);

    return {
        success: true,
        email: session.newEmail,
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

    await User.updateOne({ _id: session.user.id }, { email: session.newEmail });

    delete session.newEmail;
    delete session.otp;
    delete session.otpExpiry;

    return {
        success: true
    }
}


exports.changePassword = async (body, session) => {

    const { currentPassword, newPassword } = body;

    const user = await User.findById(session.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return {
            success: false,
            message: "Please enter the correct password"
        }
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
        return {
            success: false,
            message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character"
        }
    }

    if (newPassword === currentPassword) {
        return {
            success: false,
            message: "New password cannot be the same as your current password"
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ _id: session.user.id }, { password: hashedPassword});

    return {
        success: true,
        message: "Password changed successfully"
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