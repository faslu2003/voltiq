const express = require('express');

const router = express.Router();

const userController = require('../controllers/userController');

const upload = require('../config/multer');

const authMiddleware = require('../middlewares/authMiddleware');



router.get('/signup', userController.getSignup);
router.post('/signup', userController.postSignup);

router.get('/signup/verification', userController.getSignupVerification);
router.post('/signup/verification', userController.postSignupVerification);


router.get('/signin', userController.getSignin);
router.post('/signin', userController.postSignin);

router.post('/auth/google', userController.googleAuth);

router.get('/signin/reset-password', userController.getResetPassword);
router.post('/signin/reset-password', userController.postResetPassword);


router.post('/resend-otp', userController.resendOtp);



router.use(['/home', '/profile', '/email', '/change-password', '/address', '/logout'], authMiddleware.authenticateUser, authMiddleware.checkBlocked);



router.get('/home', userController.getHome);


router.get('/profile', userController.getProfile);
router.get('/profile/edit', userController.getEditProfile);
router.post('/profile/edit', upload.single("avatar"), userController.postEditProfile);


router.get('/email/verify-current', userController.getVerifyCurrentEmail);
router.get('/email/verify-new', userController.getVerifyNewEmail);

router.post('/email/verify-current', userController.postVerifyCurrentEmail);
router.post('/email/verify-new', userController.postVerifyNewEmail);

router.get('/email/verify-otp-1', userController.getVerifyOtp1);
router.get('/email/verify-otp-2', userController.getVerifyOtp2);

router.post('/email/verify-otp-1', userController.postVerifyOtp1);
router.post('/email/verify-otp-2', userController.postVerifyOtp2);

router.get('/change-password', userController.getChangePassword);
router.post('/change-password', userController.postChangePassword);


router.get('/address', userController.getAddress);

router.get('/address/add', userController.getAddAddress);
router.post('/address/add', userController.postAddAddress);

router.get('/address/edit/:id', userController.getEditAddress);
router.post('/address/edit/:id', userController.postEditAddress);

router.post('/address/delete/:id', userController.deleteAddress);


router.post('/logout', userController.logout);









module.exports = router;