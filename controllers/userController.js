const User = require('../src/models/User');
const Address = require('../src/models/Address');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Brand = require('../src/models/Brand');
const Order = require('../src/models/Order');
const Cart = require('../src/models/Cart');

const authService = require('../services/authService');
const userService = require('../services/userService');

const STATUS_CODES = require('../constants/statusCode');



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


exports.getForgotPassword = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    const message = req.session.message || null;
    req.session.message = null;

    res.render('user/forgot-password', { error, message });
}

exports.postForgotPassword = async (req, res) => {

    try {

        const result = await authService.forgotPassword(req.body);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/signin/password/forgot');
        }

        if (result.success) {
            req.session.message = result.message;
            return res.redirect('/signin/password/forgot');
        }
    }

    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";
        return res.redirect('/signin/password/forgot');
    }
}

exports.getResetPassword = async (req, res) => {

    try {

        const { token } = req.params;

        const result = await authService.validateResetToken(token);

        if (!result.success) {
            return res.render('user/reset-password', { error: result.message, token });
        }

        return res.render('user/reset-password', { error: null, token });
    }
    catch (err) {
        console.log(err);

        return res.render('user/reset-password', { error: "Something went wrong. Please try again.", token });
    }
}

exports.postResetPassword = async (req, res) => {

    try {

        console.log("POST RESET ROUTE HIT");

        const result = await authService.resetPassword(req.params.token, req.body);

        const { token } = req.params;

        if (!result.success) {
            return res.render("user/reset-password", {
                error: result.message,
                token
            });
        }

        return res.redirect('/signin');
    }
    catch (err) {
        console.error(err);

        return res.render("user/reset-password", {
            error: "Something went wrong. Please try again.",
            token
        });
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

exports.patchEditProfile = async (req, res) => {

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

    return res.json(result);
}





exports.getChangePassword = (req, res) => {

    const error = req.session.error || null;
    req.session.error = null;

    res.render('user/change-password', { error });
}

exports.patchChangePassword = async (req, res) => {

    try {

        const result = await userService.changePassword(req.body, req.session);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/change-password');
        }

        req.session.message = result.message;
        return res.redirect('/profile');
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again"

        res.redirect('/change-password');
    }
}



// ADDRESS 

exports.getAddress = async (req, res) => {

    const user = await User.findById(req.session.user.id);

    const addresses = await Address.find({ userId: req.session.user.id });

    res.render('user/address', { user, addresses });
}


exports.getAddAddress = async (req, res) => {

    const user = await User.findById(req.session.user.id);

    const error = req.session.error || null;
    req.session.error = null;

    const data = req.session.data || {};
    req.session.data = null;

    const redirect = req.query.redirect || '';

    res.render('user/add-address', { error, user, data, redirect });
}

exports.postAddAddress = async (req, res) => {

    try {
        const result = await userService.addAddress(req.body, req.session);

        if (!result.success) {
            req.session.error = result.message;
            req.session.data = req.body;
            const redirect = req.body.redirect === "checkout" ? '?redirect=checkout' : '';
            return res.redirect(`/address/add${redirect}`);
        }

        if (result.success) {
            if (req.body.redirect === "checkout") {
                return res.redirect('/checkout');
            }
            else {
                return res.redirect('/address');
            }
        }
    }
    catch (err) {
        console.error(err);
        req.session.error = "Something went wrong. Please try again";
        const redirect = req.body.redirect === "checkout" ? '?redirect=checkout' : '';
        return res.redirect(`/address/add${redirect}`);
    }
}


exports.getEditAddress = async (req, res) => {

    const address = await Address.findOne({ _id: req.params.id, userId: req.session.user.id });

    const error = req.session.error || null;
    req.session.error = null;

    const data = req.session.data || {};
    req.session.data = null;

    const redirect = req.query.redirect || '';

    res.render('user/edit-address', { address, error, data, redirect });
}

exports.patchEditAddress = async (req, res) => {

    try {

        const result = await userService.editAddress(req.params.id, req.body, req.session,);

        if (!result.success) {
            req.session.error = result.message;
            req.session.data = req.body;
            const redirect = req.body.redirect === "checkout" ? '?redirect=checkout' : '';
            return res.redirect(`/address/edit/${req.params.id}${redirect}`);
        }

        if (result.success) {
            if (req.body.redirect === "checkout") {
                return res.redirect('/checkout');
            }
            else {
                return res.redirect('/address');
            }
        }
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again";
        const redirect = req.body.redirect === "checkout" ? '?redirect=checkout' : '';
        res.redirect(`/address/edit/${req.params.id}${redirect}`);
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



exports.getProducts = async (req, res) => {

    try {
        const categories = await Category.find({ isActive: true });
        const brands = await Brand.find({ isActive: true });

        let selectedCategoryId = req.params.categoryId;

        if (!selectedCategoryId) {
            const smartphones = categories.find(category => category.categoryName === "Smartphones");

            if (smartphones) {
                selectedCategoryId = smartphones._id.toString();
            }
        }

        const search = req.query.search || "";
        const sort = req.query.sort || "newest";

        const maxPrice = Number(req.query.maxPrice) || 500000;
        const selectedBrands = req.query.brands
            ? Array.isArray(req.query.brands)
                ? req.query.brands
                : [req.query.brands]
            : [];

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = 6;

        const userId = req.session.user.id;

        const result = await userService.getProducts(selectedCategoryId, search, sort, maxPrice, selectedBrands, page, limit, userId);

        const expanded = req.query.expanded === 'true';

        const error = req.session.error || null;
        req.session.error = null;

        const wishlistVariantIds = result.wishlistVariantIds.map((variantId) => {
            return variantId.toString();
        });

        return res.render('user/products', {
            categories,
            brands,
            products: result.products,
            selectedCategoryId,
            search,
            sort,
            maxPrice,
            selectedBrands,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            expanded,
            error,
            wishlistVariantIds
        });
    }
    catch (err) {
        console.log(err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Something went wrong.");
    }
}

exports.getProductDetails = async (req, res) => {

    try {
        const productId = req.params.productId;

        const result = await userService.getProductDetails(productId);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/products');
        }

        const product = result.product;
        const ecosystemProducts = result.ecosystemProducts;

        const categoryId = result.categoryId;
        const categoryName = result.categoryName;

        return res.render('user/product-details', { product, ecosystemProducts, categoryId, categoryName });
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again."
        return res.redirect('/products');
    }
}



exports.getWishlist = async (req, res) => {

    try {
        const userId = req.session?.user?.id;

        const result = await userService.getWishlist(userId);

        const wishlistItems = result.wishlistItems;

        const error = req.session.error || null;
        req.session.error = null;

        return res.render('user/wishlist', { wishlistItems, error });
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again."
        return res.redirect('/home');
    }
}


exports.addToWishlist = async (req, res) => {

    try {
        const userId = req.session.user.id;
        const { variantId } = req.body;

        const result = await userService.addToWishlist(userId, variantId);

        return res.json(result);
    }
    catch (err) {
        console.log(err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
}


exports.moveToCart = async (req, res) => {

    try {
        const userId = req.session.user.id;
        const { variantId } = req.body;

        const firstResult = await userService.addToCart(userId, variantId);

        if (firstResult.success) {

            const secondResult = await userService.removeFromWishlist(userId, variantId);

            return res.json(secondResult);
        }
        else {
            return res.json(firstResult);
        }
    }
    catch (err) {
        console.log(err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
}


exports.removeWishlistItem = async (req, res) => {

    try {
        const userId = req.session.user.id;
        const { variantId } = req.body;

        const result = await userService.removeFromWishlist(userId, variantId);

        return res.json(result);
    }
    catch (err) {
        console.log(err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
}



exports.getCart = async (req, res) => {

    try {
        const result = await userService.getCart(req.session.user.id);

        const error = req.session.error || null;
        req.session.error = null;

        const cartItems = result.cartItems;

        return res.render('user/cart', { cartItems, error });
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again.";
        return res.redirect('/home');
    }
}


exports.addToCart = async (req, res) => {

    try {
        const userId = req.session.user.id;
        const { variantId } = req.body;

        const result = await userService.addToCart(userId, variantId);

        return res.json(result);
    }
    catch (err) { }
}


exports.updateCart = async (req, res) => {

    try {
        const userId = req.session.user.id;
        const { variantId, quantity } = req.body;

        const result = await userService.updateCart(userId, variantId, quantity);

        return res.json(result);
    }
    catch (err) { }
}


exports.removeCartItem = async (req, res) => {

    try {
        const userId = req.session.user.id;
        const { variantId } = req.body;

        const result = await userService.removeCartItem(userId, variantId);

        return res.json(result);
    }
    catch (err) { }
}



exports.getCheckout = async (req, res) => {

    try {
        const userId = req.session.user.id;

        const result = await userService.getCheckout(userId);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/cart');
        }

        const addresses = result.addresses;
        const cartItems = result.cartItems;

        const coupons = result.coupons;
        const offers = result.offers;

        let discountAmount = null;
        let couponCode = null;

        let appliedCouponId = req.session.appliedCouponId;

        if (appliedCouponId) {
            const validationResult = await userService.validateCoupon(appliedCouponId);

            if (!validationResult.success) {
                req.session.appliedCouponId = null;
                appliedCouponId = null;
            }
            else {
                const coupon = validationResult.coupon;

                const result = await userService.applyCoupon(coupon, userId);

                if (!result.success) {
                    req.session.appliedCouponId = null;
                    appliedCouponId = null;
                }
                else {
                    discountAmount = result.discountAmount;
                    couponCode = result.couponCode;
                }
            }
        }

        res.render('user/checkout', { addresses, cartItems, coupons, offers, appliedCouponId, couponCode, discountAmount });
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again."
        return res.redirect('/cart');
    }
}


exports.applyCoupon = async (req, res) => {

    try {
        const { couponId } = req.body;

        const validationResult = await userService.validateCoupon(couponId);

        if (!validationResult.success) {
            return res.json(validationResult);
        }

        const coupon = validationResult.coupon;

        const userId = req.session.user.id;

        const result = await userService.applyCoupon(coupon, userId);

        if (!result.success) {
            return res.json(result);
        }

        req.session.appliedCouponId = couponId;
        return res.json(result);
    }
    catch (err) {
        console.log(err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
}


exports.removeCoupon = async (req, res) => {

    try {
        req.session.appliedCouponId = null;

        return res.json({
            success: true
        });
    }
    catch (err) {
        console.log(err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
}


exports.postCheckout = async (req, res) => {

    try {
        const userId = req.session.user.id;

        const { addressId, shippingMethod, paymentMethod } = req.body;

        const addressResult = await userService.validateAddress(addressId, userId);

        const shippingAddress = addressResult.address;

        if (!addressResult.success) {
            req.session.error = addressResult.message;
            return res.redirect('/checkout');
        }

        const cartResult = await userService.validateCartItems(userId);

        if (!cartResult.success) {
            req.session.error = cartResult.message;
            return res.redirect('/checkout');
        }

        const { orderItems, subtotal } = cartResult;

        const shippingCharge = shippingMethod === "express" ? 200 : 0;

        let otherCharges;

        otherCharges = paymentMethod === "COD" ? 50 : 0;

        let discountAmount = 0;
        const couponId = req.session.appliedCouponId;

        if (couponId) {
            const couponResult = await userService.validateCoupon(couponId);

            if (!couponResult.success) {
                req.session.appliedCouponId = null;
                req.session.error = couponResult.message;
                return res.redirect('/checkout');
            }

            const coupon = couponResult.coupon;

            let discountResult = await userService.applyCoupon(coupon, userId);

            if (!discountResult.success) {
                req.session.error = discountResult.message;
                return res.redirect('/checkout');
            }

            discountAmount = discountResult.discountAmount;
        }

        const totalPrice = subtotal - discountAmount + shippingCharge + otherCharges;

        if (paymentMethod !== "COD") {
            req.session.error = "Online payment is not currently available.";
            return res.redirect('/checkout');
        }

        const order = await Order.create({
            orderId: userService.generateOrderId(),
            userId,
            orderItems,
            subtotal,
            shippingCharge,
            otherCharges,
            discountAmount,
            totalPrice,
            shippingAddress,
            payment: {
                paymentMethod: "COD",
                paymentStatus: "Pending"
            }
        });

        await Cart.deleteOne({ userId });

        req.session.appliedCouponId = null;

        return res.status(201).json({
            success: true,
            redirectUrl: `order-success/${order.orderId}`
        });
    }
    catch (err) {
        console.log(err);
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Unable to place your order."
        });
    }
}


exports.getOrderSuccess = async (req, res) => {

    try {
        const userId = req.session.user.id;
        const { orderId } = req.params;

        const order = await Order.findOne({ orderId, userId });

        if (!order) {
            return res.redirect('/orders');
        }

        return res.render('user/order-success', { order });
    }
    catch (err) {
        console.log(err);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Something went wrong.");
    }
}



exports.getOrders = async (req, res) => {

    try {
        const userId = req.session.user.id;

        const currentPage = Math.max(1, parseInt(req.query.page, 10) || 1);

        const limit = 5;

        const totalOrders = await userService.totalOrders(userId);

        const totalPages = Math.ceil(totalOrders / limit);

        const page = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

        const skip = (page - 1) * limit;

        const orders = await userService.getOrders(userId, skip, limit);

        return res.render('user/order-history', {
            orders,
            pagination: {
                currentPage: page,
                totalPages
            }
        });
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong."
        return;
    }
}


exports.getOrderDetails = async (req, res) => {

    try {
        const userId = req.session.user.id;

        const { orderId } = req.params;

        const result = await userService.getOrder(orderId, userId);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect('/orders');
        }

        const order = result.order;

        return res.render('user/order-item-details', { order });
    }
    catch (err) {
        console.log(err);
        req.session.error = "Something went wrong. Please try again."
        return res.redirect('/orders');
    }
}





// LOG OUT

exports.logout = (req, res) => {

    req.session.destroy(() => {
        res.redirect('/signin');
    })
}






