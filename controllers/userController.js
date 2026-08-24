const User = require('../src/models/User');
const Address = require('../src/models/Address');

const authService = require('../services/authService');
const userService = require('../services/userService');



// SIGN UP

exports.getSignup = (req, res) => {

    if (req.session.user) {
        return res.redirect('/home');
    }

    const error = req.session.error || null;
    req.session.error = null;

    const data = req.session.data || {};
    req.session.data = null;

    res.render('user/signup', { error, data });
}

exports.postSignup = async (req, res) => {

    try {

        const result = await authService.signup(req.body);

        if (!result.success) {
            req.session.error = result.message;
            req.session.data = {
                fullName: req.body.fullName,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber
            };
            return res.redirect('/signup');
        }

        if (result.success) {
            req.session.pendingUser = result.pendingUser;
            req.session.otp = result.otp;
            req.session.otpExpiry = result.otpExpiry;
            req.session.resendOtpExpiry = result.resendOtpExpiry;

            return res.redirect('/signup/verification');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";
        res.redirect('/signup');
    }
}


exports.getSignupVerification = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    const resendSeconds = Math.max(0, Math.ceil((req.session.resendOtpExpiry - Date.now()) / 1000));

    res.render('user/signup-verification', { error, resendSeconds });
}

exports.postSignupVerification = async (req, res) => {

    try {

        const result = await authService.signupVerification(req.body, req.session);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/signup/verification');
        }

        if (result.success) {
            req.session.message = result.message;
            return res.redirect('/signin');
        }
    }

    catch (err) {
        console.error(err);
        req.session.error = "Something went wrong. Please try again";
        return res.redirect('/signup');
    }
}



// SIGN IN

exports.getSignin = (req, res) => {

    if (req.session.user) {
        return res.redirect('/home');
    }

    const message = req.session.message || null;
    req.session.message = null;

    const error = req.session.error || null;
    req.session.error = null;

    const data = req.session.data || {};
    req.session.data = null;

    res.render('user/signin', { error, message, data });
}

exports.postSignin = async (req, res) => {

    try {

        const result = await authService.signin(req.body);

        if (!result.success) {
            req.session.error = result.message;
            req.session.data = {
                email: req.body.email
            };
            return res.redirect('/signin');
        }

        const user = result.user;

        if (result.success) {
            req.session.user = {
                id: user._id
            }

            return res.redirect('/home');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        return res.redirect('/signin');
    }
}


exports.googleAuth = async (req, res) => {

    try {

        const googleUser = await authService.googleAuth(req.body.credential);

        const result = await authService.googleSignin(googleUser);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/signin');
        }

        req.session.user = {
            id: result.user._id
        }

        return res.redirect('/home');
    }
    catch (err) {

        console.log(err);
        req.session.error = "Google authentication failed. Please try again.";

        return res.redirect('/signin');
    }
}


exports.getResetPassword = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    const message = req.session.message || null;
    req.session.message = null;

    res.render('user/reset-password', { error, message });
}

exports.postResetPassword = async (req, res) => {

    try {

        const result = await authService.resetPassword(req.body);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/signin/reset-password');
        }

        if (result.success) {
            req.session.message = result.message;
            return res.redirect('/signin/reset-password');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";
        return res.redirect('/signin/reset-password');
    }
}



// HOME

exports.getHome = (req, res) => {

    res.render('user/home');
}



// PROFILE

exports.getProfile = async (req, res) => {

    const user = await User.findById(req.session.user.id);

    console.log(user);

    const message = req.session.message || null;
    req.session.message = null;

    res.render('user/profile', { user, message });
}

exports.getEditProfile = async (req, res) => {

    const user = await User.findById(req.session.user.id);

    const error = req.session.error || null;
    req.session.error = null;

    const data = req.session.data || {};
    req.session.data = null;

    res.render('user/edit-profile', { user, error, data });
}

exports.postEditProfile = async (req, res) => {

    try {

        const result = await userService.editProfile(req.body, req.file, req.session);

        if (!result.success) {
            req.session.error = result.message;
            req.session.data = req.body;
            return res.redirect('/profile/edit');
        }

        if (result.success && result.requiresEmailVerification) {
            return res.redirect('/email/verify-current');
        }

        if (result.success) {
            req.session.message = result.message;
            return res.redirect('/profile');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/profile/edit');
    }
}



// EMAIL 

exports.getVerifyCurrentEmail = async (req, res) => {

    const user = await User.findById(req.session.user.id);

    const error = req.session.error || null;
    req.session.error = null

    res.render('user/verify-current-email', { user, error });
}

exports.postVerifyCurrentEmail = (req, res) => {

    try {

        const result = userService.verifyCurrentEmail();

        if (result.success) {
            req.session.otp = result.otp;
            req.session.otpExpiry = result.otpExpiry;
            req.session.resendOtpExpiry = result.resendOtpExpiry;

            return res.redirect('/email/verify-otp-1');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        return res.redirect('/email/verify-current');
    }
}

exports.getVerifyOtp1 = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    const resendSeconds = Math.max(0, Math.ceil((req.session.resendOtpExpiry - Date.now()) / 1000));

    res.render('user/verify-otp-1', { error, resendSeconds });
}

exports.postVerifyOtp1 = async (req, res) => {

    try {

        const result = await userService.verifyOtp1(req.body, req.session);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/email/verify-otp-1');
        }

        if (result.success) {
            return res.redirect('/email/verify-new');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/email/verify-otp-1');
    }
}


exports.getVerifyNewEmail = async (req, res) => {

    const user = await User.findById(req.session.user.id);
    const newEmail = req.session.newEmail;

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/verify-new-email', { error, user, newEmail });
}

exports.postVerifyNewEmail = async (req, res) => {

    try {

        const result = await userService.verifyNewEmail(req.body, req.session);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/email/verify-new');
        }

        if (result.success) {
            req.session.email = result.email;
            req.session.otp = result.otp;
            req.session.otpExpiry = result.otpExpiry;
            req.session.resendOtpExpiry = result.resendOtpExpiry;

            return res.redirect('/email/verify-otp-2');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/email/verify-new');
    }
}

exports.getVerifyOtp2 = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    const resendSeconds = Math.max(0, Math.ceil((req.session.resendOtpExpiry - Date.now()) / 1000));

    res.render('user/verify-otp-2', { error, resendSeconds });
}


exports.postVerifyOtp2 = async (req, res) => {

    try {

        const result = await userService.verifyOtp2(req.body, req.session);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/email/verify-otp-2');
        }

        if (result.success) {
            req.session.message = result.message;
            return res.redirect('/profile');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/email/verify-otp-1');
    }
}


exports.resendOtp = async (req, res) => {

    const result = await userService.resendOtp(req.session);

    res.json(result);
}





exports.getChangePassword = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/change-password', { error });
}

exports.postChangePassword = async (req, res) => {

    try {

        const result = await userService.changePassword(req.body, req.session);

        if (!result.success) {
            req.session.error = result.message;
            res.redirect('/change-password');
        }

        req.session.message = result.message;
        res.redirect('/profile');
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again"

        res.redirect('/change-password');
    }
}



// ADDRESS 

exports.getAddress = async (req, res) => {

    const user = User.findById(req.session.user.id);

    const addresses = await Address.find({ userId: req.session.user.id });

    res.render('user/address', { user, addresses });
}


exports.getAddAddress = async (req, res) => {

    const user = await User.findById(req.session.user.id);

    const error = req.session.error || null;
    req.session.error = null;

    const data = req.session.data || {};
    req.session.data = null;

    res.render('user/add-address', { error, user, data });
}

exports.postAddAddress = async (req, res) => {

    try {
        const result = await userService.addAddress(req.body, req.session);

        if (!result.success) {
            req.session.error = result.message;
            req.session.data = req.body;
            return res.redirect('/address/add');
        }

        if (result.success) {
            return res.redirect('/address');
        }
    }
    catch (err) {
        console.error(err);
        req.session.error = "Something went wrong. Please try again";
        return res.redirect('/address/add');
    }
}


exports.getEditAddress = async (req, res) => {

    const address = await Address.findOne({ _id: req.params.id, userId: req.session.user.id });

    const error = req.session.error || null;
    req.session.error = null;

    const data = req.session.data || {};
    req.session.data = null;

    res.render('user/edit-address', { address, error, data });
}

exports.postEditAddress = async (req, res) => {

    try {

        const result = await userService.editAddress(req.params.id, req.body, req.session,);

        if (!result.success) {
            req.session.error = result.message;
            req.session.data = req.body;
            return res.redirect(`/address/edit/${req.params.id}`);
        }

        if (result.success) {
            return res.redirect('/address');
        }
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";
        res.redirect(`/address/edit/${req.params.id}`);
    }
}


exports.deleteAddress = async (req, res) => {

    try {

        const result = await userService.deleteAddress(req.params.id, req.session);

        if (result.success) {
            return res.redirect('/address');
        }
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/address');
    }
}



// LOG OUT

exports.logout = (req, res) => {

    req.session.destroy(() => {
        res.redirect('/signin');
    })
}