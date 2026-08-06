const User = require('../src/models/User');

const authService = require('../services/authService');
const userService = require('../services/userService');



// SIGN UP

exports.getSignup = (req, res) => {

    if (req.session.user) {
        return res.redirect('/home');
    }

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/signup', { error });
}

exports.postSignup = async (req, res) => {

    const result = await authService.signup(req.body);

    if (!result.success) {
        req.session.error = result.message;
        return res.redirect('/signup');
    }

    try {

        if (result.success) {
            req.session.pendingUser = result.pendingUser;
            req.session.otp = result.otp;
            req.session.otpExpiry = result.otpExpiry;

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

    res.render('user/signup-verification', { error });
}

exports.postSignupVerification = async (req, res) => {

    const result = await authService.signupVerification(req.body, req.session);

    if (!result.success) {
        req.session.error = result.message;
        return res.redirect('/signup/verification');
    }

    try {

        if (result.success) {
            return res.redirect('/signin');
        }
    }

    catch(err) {
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

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/signin', { error });
}

exports.postSignin = async (req, res) => {

    const result = await authService.signin(req.body);

    if (!result.success) {
        req.session.error = result.message;
        return res.redirect('/signin');
    }

    try {

        const user = result.user;

        if (result.success) {
            req.session.user = {
                id: user._id
            }

            return res.redirect('/home');
        }
    }

    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

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

    const result = await authService.resetPassword(req.body);

    if (!result.success) {
        req.session.error = result.message;
    }

    try {
        if (result.success) {
            req.session.message = result.message;
            return res.redirect('/signin/reset-password');
        }
    }

    catch(err) {
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

    res.render('user/profile', { user });
}

exports.getEditProfile = async (req, res) => {

    const user = await User.findById(req.session.user.id);

    const message = req.session.message || null;
    req.session.message = null;

    res.render('user/edit-profile', { message, user });
}

exports.postEditProfile = async (req, res) => {

    const result = await userService.editProfile(req.body, req.session);

    if (result.success & result.isEmail) {
        return res.redirect('/email/verify-current');
    }

    if (result.success) {
        req.session.message = result.message;
        return res.redirect('/profile');
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

    const result = userService.verifyCurrentEmail();

    try {
        if (result.success) {
            req.session.otp = result.otp;
            req.session.otpExpiry = result.otpExpiry;

            return res.redirect('/email/verify-otp-1');
        }
    }
    
    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        return res.redirect('/email/verify-current');
    }
}

exports.getVerifyOtp1 = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/verify-otp-1', { error });
}

exports.postVerifyOtp1 = async (req, res) => {

    const result = await userService.verifyOtp1(req.body, req.session);

    if (!result.success) {
        req.session.error = result.message;
        return res.redirect('/email/verify-otp-1');
    }

    try {
        if (result.success) {
            return res.redirect('/email/verify-new');
        }
    }

    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/email/verify-otp-1');
    }
}


exports.getVerifyNewEmail = async (req, res) => {

    const user = await User.findById(req.session.user.id);
    const newEmail = req.session.newEmail;

    const error = req.session.error = null;
    req.session.error = null;

    res.render('user/verify-new-email', { error, user, newEmail });
}

exports.postVerifyNewEmail = async (req, res) => {

    const result = await userService.verifyNewEmail(req.body, req.session);

    if (!result.success) {
        req.session.error = result.message;
        return res.redirect('/email/verify-new');
    }

    try {
        if (result.success) {
            req.session.email = result.email;
            req.session.otp = result.otp;
            req.session.otpExpiry = result.otpExpiry;

            return res.redirect('/email/verify-otp-2');
        }
    }

    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/email/verify-new');
    }
}

exports.getVerifyOtp2 = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/verify-otp-2', {error});
}


exports.postVerifyOtp2 = async (req, res) => {

    const result = await userService.verifyOtp2(req.body, req.session);

    if (!result.success) {
        req.session.error = result.message;
        return res.redirect('/email/verify-otp-2');
    }

    try {
        if (result.success) {
            return res.redirect('/profile');
        }
    }

    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";

        res.redirect('/email/verify-otp-1');
    }
}



// ADDRESS 

exports.getAddress = (req, res) => {

    res.render('user/address');
}


exports.getAddAddress = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/add-address', { error });
}

exports.postAddAddress = async (req, res) => {

    const result = await userService.addAddress(req.body);

    if (!result.success) {
        req.session.error = result.message;
        res.redirect('/address/add');
    }

    try {
        if (result.success) {
            res.redirect('/address');
        }
    }
    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";
    }
}


exports.getEditAddress = (req, res) => {

    res.render('user/edit-address');
}

exports.postEditAddress = async (req, res) => {

    const result = await userService.editAddress(req.body, req.session, );

    if (!result.success) {
        req.session.error = result.message;
        res.redirect('/address/edit');
    }

    try {
        if (result.success) {
            res.redirect('/address');
        }
    }
    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";
        res.redirect('/address/edit');
    }
}


exports.deleteAddress = async (req, res) => {

    const result = userService.deleteAddress();

    try {
        if (result.success) {
            res.redirect('/address');
        }
    }
    catch(err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";
    }
}



// LOG OUT

exports.logout = (req, res) => {

    req.session.destroy(() => {
        res.redirect('/signin');
    })
}