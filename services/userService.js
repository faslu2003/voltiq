const User = require('../src/models/User');

const Address = require('../src/models/Address');
const addressService = require('./addressService');

const bcrypt = require('bcrypt');



exports.editProfile = async (body, file, session) => {

    const { fullName, email, phoneNumber } = body;

    const id = session.user.id;

    const user = await User.findById(id);

    if (fullName !== user.fullName) {
        await User.updateOne({ _id: id }, { fullName });
    }

    if (phoneNumber !== user.phoneNumber) {
        await User.updateOne({ _id: id }, { phoneNumber });
    }

    if (file) {
        await User.updateOne({ _id: id }, { profileImgUrl: `/uploads/${file.filename}` });
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
        message: "Edited successfully."
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
        otpExpiry: Date.now() + 3 * 60 * 1000,
        resendOtpExpiry: Date.now() + 60 * 1000
    }
}

exports.verifyOtp1 = (body, session) => {

    const enteredOTP = Object.values(body).join("");

    if (Date.now() > session.otpExpiry) {
        return {
            success: false,
            message: "OTP has expired."
        }
    }

    if (enteredOTP !== session.otp) {
        return {
            success: false,
            message: "Entered OTP is invalid."
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
        otpExpiry: Date.now() + 3 * 60 * 1000,
        resendOtpExpiry: Date.now() + 60 * 1000
    }
}


exports.verifyOtp2 = async (body, session) => {

    const enteredOTP = Object.values(body).join("");

    if (Date.now() > session.otpExpiry) {
        return {
            success: false,
            message: "OTP has expired."
        }
    }

    if (enteredOTP !== session.otp) {
        return {
            success: false,
            message: "Entered OTP is invalid."
        }
    }

    await User.updateOne({ _id: session.user.id }, { email: session.newEmail });

    delete session.newEmail;
    delete session.otp;
    delete session.otpExpiry;

    return {
        success: true,
        message: "Email updated successfully."
    }
}


exports.resendOtp = async (session) => {

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    session.otp = otp;
    session.otpExpiry = Date.now() + 3 * 60 * 1000;
    session.resendOtpExpiry = Date.now() + 60 * 1000;

    console.log("OTP:", otp);

    return {
        success: true,
        resendSeconds: 60
    };
}


exports.changePassword = async (body, session) => {

    const { currentPassword, newPassword } = body;

    const user = await User.findById(session.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return {
            success: false,
            message: "Please enter the correct password."
        }
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
        return {
            success: false,
            message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        }
    }

    if (newPassword === currentPassword) {
        return {
            success: false,
            message: "New password cannot be the same as your current password."
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ _id: session.user.id }, { password: hashedPassword });

    return {
        success: true,
        message: "Password changed successfully."
    }
}


function normalize(value) {
    return value
        ?.toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
}

exports.addAddress = async (body, session) => {

    const { fullName, phoneNumber, pincode, houseName, locality, landmark, city, state, addressType } = body;

    console.log(body);

    if (!fullName || !phoneNumber || !pincode || !houseName || !locality || !city || !state || !addressType) {
        return {
            success: false,
            message: "Please fill in all the fields."
        }
    }

    const isDefault = body.isDefault === "true";

    const result = await addressService.validateAddress(body);
    console.log("GEOAPIFY RESULT:", result);

    if (!result.results || result.results.length === 0) {
        return {
            success: false,
            message: "We couldn't verify this address. Please check your address details."
        };
    }

    const isValidAddress = result.results.some(address => {

        const countryMatches =
            address.country_code?.toLowerCase() === "in";

        const pincodeMatches =
            address.postcode === pincode;

        const stateMatches =
            address.state?.toLowerCase() === state.toLowerCase();

        const submittedLocality = normalize(locality);
        const submittedCity = normalize(city);

        const geoLocations = [
            address.city,
            address.town,
            address.village,
            address.hamlet,
            address.suburb,
            address.district,
            address.county
        ].map(normalize);

        const locationMatches = geoLocations.some(location =>
            location === submittedLocality ||
            location === submittedCity ||
            location?.includes(submittedLocality) ||
            submittedLocality.includes(location)
        );

        return (
            countryMatches &&
            pincodeMatches &&
            stateMatches &&
            locationMatches
        );
    });

    if (!isValidAddress) {
        return {
            success: false,
            message: "The address could not be verified. Please check your address details."
        };
    }

    await Address.create({
        userId: session.user.id,
        fullName,
        phoneNumber,
        pincode,
        houseName,
        locality,
        landmark,
        city,
        state,
        addressType,
        isDefault
    });

    return {
        success: true
    }
}


exports.editAddress = async (addressId, body, session) => {

    const { fullName, phoneNumber, pincode, houseName, locality, landmark, city, state, addressType } = body;

    const isDefault = body.isDefault === "true";

    if (Object.keys(body).length === 0) {
        return {
            success: false,
            message: "No changes were made."
        }
    }

    await Address.updateOne({ _id: addressId, userId: session.user.id }, { $set: body, isDefault });

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