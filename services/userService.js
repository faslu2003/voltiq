const User = require('../src/models/User');

const Address = require('../src/models/Address');
const addressService = require('./addressService');

const bcrypt = require('bcrypt');
const mailer = require('../utils/mailer');



exports.editProfile = async (body, file, session) => {

    const { fullName, email, phoneNumber } = body;

    const id = session.user.id;

    const user = await User.findById(id);

    if (fullName !== user.fullName) {
        const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
        if (!nameRegex.test(fullName)) {
            return {
                success: false,
                message: "Please enter a valid name."
            }
        }
        await User.updateOne({ _id: id }, { fullName });
    }

    if (phoneNumber !== user.phoneNumber) {
        const phoneNumRegex = /^[6-9]\d{9}$/;
        if (user.authProvider === "local") {
            if (!phoneNumRegex.test(phoneNumber)) {
                return {
                    success: false,
                    message: "Please enter a valid 10-digit phone number."
                }
            }
        }
        await User.updateOne({ _id: id }, { phoneNumber });
    }

    const removeProfilePic = body.removeProfilePic === "true";

    if (removeProfilePic) {
        await User.updateOne({ _id: id }, { $set: { profileImgUrl: null } });
    }
    else if (file) {
        await User.updateOne({ _id: id }, { $set: { profileImgUrl: `/uploads/${file.filename}` } })
    }

    if (email !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                success: false,
                message: "Please enter a valid email address."
            }
        }
        session.newEmail = email;
        return {
            success: true,
            requiresEmailVerification: true
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
    const email = session.pendingUser.email;

    session.otp = otp;
    session.otpExpiry = Date.now() + 3 * 60 * 1000;
    session.resendOtpExpiry = Date.now() + 60 * 1000;

    console.log("OTP:", otp);
    await mailer.sendOTP(email, otp);

    return {
        success: true,
        resendSeconds: 60
    };
}


exports.changePassword = async (body, session) => {

    const { currentPassword, newPassword, confirmPassword } = body;

    const user = await User.findById(session.user.id);

    if (user.authProvider === "google") {
        return {
            success: false,
            message: "Password cannot be changed for accounts created with Google."
        }
    }

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

    if (newPassword !== confirmPassword) {
        return {
            success: false,
            message: "Passwords do not match."
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

    if (!fullName || !phoneNumber || !pincode || !houseName || !locality || !city || !state || !addressType) {
        return {
            success: false,
            message: "Please fill in all the fields."
        }
    }

    const isDefault = body.isDefault === "true";

    if (isDefault) {
        const defaultAddress = await Address.findOne({ userId: session.user.id, isDefault: true });

        if (defaultAddress) {
            await Address.updateOne({ _id: defaultAddress._id }, { isDefault: false });
        }
    }

    const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
    if (!nameRegex.test(fullName)) {
        return {
            success: false,
            message: "Please enter a valid name."
        }
    }

    const phoneNumRegex = /^[6-9]\d{9}$/;
    if (!phoneNumRegex.test(phoneNumber)) {
        return {
            success: false,
            message: "Please enter a valid 10-digit phone number."
        }
    }

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(pincode)) {
        return {
            success: false,
            message: "Please enter a valid 6-digit PIN code."
        };
    }

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
            address.name,
            address.street,
            address.city,
            address.town,
            address.hamlet,
            address.suburb,
            address.county,
            address.county_district,
            address.state_district,
        ].map(normalize);

        const locationMatches = geoLocations.some(location =>
            location === submittedLocality ||
            location === submittedCity ||
            location?.includes(submittedLocality) ||
            submittedLocality.includes(location) ||
            location?.includes(submittedCity) ||
            submittedCity.includes(location)
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

    const totalAddresses = await Address.countDocuments({ userId: session.user.id });
    if (totalAddresses >= 3) {
        return {
            success: false,
            message: "You can only add maximum 3 addresses"
        }
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

    if (isDefault) {
        await Address.updateMany(
            {
                userId: session.user.id,
                _id: { $ne: addressId }
            },
            {
                $set: { isDefault: false }
            }
        );
    }

    const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
    if (!nameRegex.test(fullName)) {
        return {
            success: false,
            message: "Please enter a valid name."
        }
    }

    const phoneNumRegex = /^[6-9]\d{9}$/;
    if (!phoneNumRegex.test(phoneNumber)) {
        return {
            success: false,
            message: "Please enter a valid 10-digit phone number."
        }
    }

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(pincode)) {
        return {
            success: false,
            message: "Please enter a valid 6-digit PIN code."
        };
    }

    const result = await addressService.validateAddress(body);
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
            address.name,
            address.street,
            address.city,
            address.town,
            address.hamlet,
            address.suburb,
            address.state_district,
            address.county
        ].map(normalize);

        const locationMatches = geoLocations.some(location =>
            location === submittedLocality ||
            location === submittedCity ||
            location?.includes(submittedLocality) ||
            submittedLocality.includes(location) ||
            location?.includes(submittedCity) ||
            submittedCity.includes(location)
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

    await Address.updateOne({ _id: addressId, userId: session.user.id }, { $set: { fullName, phoneNumber, pincode, houseName, locality, landmark, city, state, addressType, isDefault } });

    return {
        success: true
    }
}


exports.deleteAddress = async (addressId, session) => {

    const result = await Address.deleteOne({ _id: addressId, userId: session.user.id });

    if (result.deletedCount === 0) {
        return {
            success: false,
            message: "Address not found."
        }
    }

    return {
        success: true
    }
}