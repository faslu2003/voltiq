const User = require('../src/models/User');
const Address = require('../src/models/Address');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Wishlist = require('../src/models/Wishlist');
const Category = require('../src/models/Category');
const Offer = require('../src/models/Offer');
const Coupon = require('../src/models/Coupon');
const CouponUsage = require('../src/models/CouponUsage');
const Order = require('../src/models/Order');

const addressService = require('./addressService');

const bcrypt = require('bcrypt');
const mailer = require('../utils/mailer');

const crypto = require('crypto');
const { userInfo } = require('os');



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



exports.getProducts = async (categoryId, search, sort, maxPrice, selectedBrands, page, limit, userId) => {

    const query = {
        categoryId,
        isActive: true
    };

    if (search) {
        query.name = {
            $regex: search,
            $options: 'i'
        };
    }

    if (selectedBrands.length > 0) {
        query.brandId = {
            $in: selectedBrands
        };
    }

    if (maxPrice) {
        query.variants = {
            $elemMatch: {
                price: { $lte: maxPrice }
            }
        };
    }

    let sortOption = {};

    switch (sort) {
        case 'price-low': {
            sortOption = { 'variants.0.price': 1 };
            break;
        }
        case 'price-high': {
            sortOption = { 'variants.0.price': -1 };
            break;
        }
        case 'a-z': {
            sortOption = { name: 1 };
            break;
        }
        case 'z-a': {
            sortOption = { name: -1 };
            break;
        }
        case 'newest': default:
            sortOption = { createdAt: -1 };
            break;
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const skip = (currentPage - 1) * limit;

    const products = await Product.find(query).sort(sortOption).skip(skip).limit(limit);

    products.forEach(product => {
        if (maxPrice) {
            const matchingVariant = product.variants.find(
                variant => variant.price <= maxPrice
            );

            product.displayVariant = matchingVariant;
        }
        else {
            product.displayVariant = product.variants[0];
        }
    });

    const wishlist = await Wishlist.findOne({ userId });

    let wishlistVariantIds;

    if (!wishlist) {
        wishlistVariantIds = [];
    }
    else {
        wishlistVariantIds = wishlist.variants;
    }

    return {
        products,
        currentPage,
        totalPages,
        totalProducts,
        wishlistVariantIds
    };
}


exports.getProductDetails = async (productId) => {

    const product = await Product.findById(productId);

    if (!product) {
        return {
            success: false,
            message: "Product not found."
        }
    }

    const brandId = product.brandId;

    const categoryId = product.categoryId;
    const category = await Category.findOne({ _id: categoryId });

    let categoryName = '';
    if (category) categoryName = category.categoryName;

    const ecosystemProducts = await Product.find({ brandId, _id: { $ne: productId } });

    return {
        success: true,
        product,
        ecosystemProducts,
        categoryId,
        categoryName
    };
}



exports.getWishlist = async (userId) => {

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        return {
            success: true,
            wishlistItems: []
        }
    }

    const variantIds = wishlist.variants;

    const wishlistItems = [];

    for (let variantId of variantIds) {

        const product = await Product.findOne({ "variants._id": variantId });

        if (!product) continue;

        const variant = product.variants.find((variant) => {
            return variant._id.toString() === variantId.toString();
        });

        wishlistItems.push({
            product,
            variant,
            isActive: product.isActive
        });
    }

    return {
        success: true,
        wishlistItems
    };
}


exports.addToWishlist = async (userId, variantId) => {

    const product = await Product.findOne({ "variants._id": variantId });

    if (!product) {
        return {
            success: false,
            message: "Product not found."
        }
    }

    if (!product.isActive) {
        return {
            success: false,
            message: "This product is unavailable."
        }
    }

    const variant = product.variants.find((variant) => {
        return variant._id.toString() === variantId;
    });

    if (!variant) {
        return {
            success: false,
            message: "Variant not found."
        };
    }

    if (variant.stock === 0) {
        return {
            success: false,
            message: "This product is out of stock."
        }
    }

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        await Wishlist.create({
            userId,
            variants: [variant._id]
        });

        return {
            success: true,
            message: "Added to wishlist."
        }
    }
    else {
        const alreadyExists = wishlist.variants.some((id) => {
            return id.toString() === variantId;
        });

        if (alreadyExists) {
            return {
                success: false,
                message: "This item is already in your wishlist."
            }
        }
        else {
            wishlist.variants.push(variant._id);
            await wishlist.save();
        }
    }

    return {
        success: true,
        "message": "Added to wishlist."
    }
}


exports.removeFromWishlist = async (userId, variantId) => {

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        return {
            success: true,
            wishlistItems: []
        }
    }

    const varId = wishlist.variants.find((variant) => {
        return variant.toString() === variantId
    });

    if (!varId) {
        return {
            success: false,
            message: "Variant not found in wishlist."
        }
    }

    await Wishlist.updateOne({ userId }, {
        $pull: {
            variants: varId
        }
    });

    return {
        success: true,
        message: "Product variant removed from wishlist."
    };
}



exports.getCart = async (userId) => {

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return {
            success: true,
            cartItems: []
        }
    }

    const items = cart.items;

    const cartItems = [];

    for (let item of items) {
        const variantId = item.variantId;

        const product = await Product.findOne({ "variants._id": variantId });

        if (!product) continue;

        const variant = product.variants.find((variant) => {
            return variant._id.toString() === variantId.toString();
        });

        cartItems.push({
            product,
            variant,
            quantity: item.quantity,
            isActive: product.isActive
        });
    }

    return {
        success: true,
        cartItems
    };
}


exports.addToCart = async (userId, variantId) => {

    const product = await Product.findOne({ "variants._id": variantId });

    if (!product) {
        return {
            success: false,
            message: "Variant not found."
        }
    }

    if (!product.isActive) {
        return {
            success: false,
            message: "The product is unavaiable."
        }
    }

    const variant = product.variants.find((variant) => {
        return variant._id.toString() === variantId;
    });

    if (variant.stock === 0) {
        return {
            success: false,
            message: "The product is out of stock."
        }
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        await Cart.create({
            userId,
            items: [
                {
                    variantId: variant._id,
                    quantity: 1
                }
            ]
        });

        return {
            success: true,
            message: "Product added to cart successfully."
        }
    }
    else {
        const item = cart.items.find((item) => {
            return item.variantId.toString() === variantId;
        });

        if (!item) {
            cart.items.push({
                variantId: variant._id,
                quantity: 1
            });

            await cart.save();
        }
        else {
            if (item.quantity >= variant.stock) {
                return {
                    success: false,
                    message: "The required quantity exceeds the stock."
                }
            }

            item.quantity += 1;

            await cart.save();
        }
    }

    return {
        success: true,
        message: "Product added to cart successfully."
    }
}


exports.updateCart = async (userId, variantId, quantity) => {

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return {
            success: false,
            message: "Cart not found."
        }
    }

    const item = cart.items.find((item) => {
        return item.variantId.toString() === variantId;
    });

    if (!item) {
        return {
            success: false,
            message: "Item not found in cart."
        }
    }

    const product = await Product.findOne({ "variants._id": variantId });

    const variant = product.variants.find((variant) => {
        return variant._id.toString() === variantId;
    });

    if (quantity > variant.stock) {
        return {
            success: false,
            message: "The required quantity exceeds the stock."
        }
    }

    item.quantity = quantity;
    await cart.save();

    return {
        success: true,
        message: "Updated quantity successfully."
    };
}


exports.removeCartItem = async (userId, variantId) => {

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return {
            success: false,
            message: "Cart not found."
        }
    }

    const index = cart.items.findIndex((item) => {
        return item.variantId.toString() === variantId;
    });

    if (index === -1) {
        return {
            success: false,
            message: "Product variant not found."
        }
    }

    cart.items.splice(index, 1);

    await cart.save();

    return {
        success: true,
        message: "Item removed from cart successfully."
    };
}



exports.getCheckout = async (userId) => {

    const addresses = await Address.find({ userId }).sort({ isDefault: -1 });

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return {
            success: false,
            message: "There are no items in your cart."
        }
    }

    const items = cart.items;

    let validCartItems = [];

    for (let item of items) {
        const product = await Product.findOne({ "variants._id": item.variantId });

        if (!product) continue;

        const variant = product.variants.find((variant) => {
            return variant._id.toString() === item.variantId.toString();
        });

        if (!variant) continue;

        if (product.isActive && variant.stock >= item.quantity) {
            validCartItems.push(item);
        }
    }

    if (validCartItems.length === 0) {
        return {
            success: false,
            message: "The item(s) in your cart is currently unavailable."
        }
    }

    const cartItems = [];

    for (let item of validCartItems) {
        const product = await Product.findOne({ "variants._id": item.variantId });
        if (!product) continue;

        const variant = product.variants.find((variant) => {
            return variant._id.toString() === item.variantId.toString();
        });

        cartItems.push({
            product,
            variant,
            quantity: item.quantity
        });
    }

    const coupons = await Coupon.find({ isActive: true });
    const offers = await Offer.find({ isActive: true });

    return {
        success: true,
        addresses,
        cartItems,
        coupons,
        offers
    };
}


exports.validateCoupon = async (couponId) => {

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
        return {
            success: false,
            message: "The coupon is invalid or has expired."
        }
    }

    if (!coupon.isActive) {
        return {
            success: false,
            message: "The coupon is invalid or has expired."
        }
    }

    const currentDate = Date.now();

    if (coupon.expiryDate) {
        if (currentDate >= coupon.expiryDate.getTime()) {
            return {
                success: false,
                message: "The coupon has expired."
            }
        }
    }

    return {
        success: true,
        coupon
    }
}


exports.applyCoupon = async (coupon, userId) => {

    const couponCode = coupon.couponCode;

    let discountAmount = 0;

    let subtotal = 0;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return {
            success: false,
            message: "Cart not found."
        }
    }

    const cartItems = cart.items;

    for (let item of cartItems) {
        const product = await Product.findOne({ "variants._id": item.variantId });

        if (!product) continue;

        const variant = product.variants.find((variant) => {
            return variant._id.toString() === item.variantId.toString();
        });

        if (!variant) continue;

        subtotal += item.quantity * variant.price;
    }

    if (subtotal < coupon.minimumPurchase) {
        let remainingPurchase = coupon.minimumPurchase - subtotal;
        return {
            success: false,
            message: `Purchase for ₹${remainingPurchase.toLocaleString('en-IN')} more to avail the coupon.`
        }
    }

    if (coupon.discountType === "percentage") {
        discountAmount = Math.round((subtotal * coupon.discountValue) / 100);

        if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) discountAmount = coupon.maximumDiscount;
    }
    else {
        discountAmount = coupon.discountValue;
    }


    return {
        success: true,
        couponCode,
        discountAmount
    };
}


exports.generateOrderId = () => {

    return`VTQ-${crypto.randomUUID()
        .replace(/-/g, '')
        .slice(0, 12)
        .toUpperCase()}`;
}


exports.validateAddress = async (addressId, userId) => {

    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
        return {
            success: false,
            message: "Please select a valid address."
        }
    }

    return {
        success: true,
        address
    }
}


exports.validateCartItems = async (userId) => {

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return {
            success: false,
            message: "There are no items in your cart."
        }
    }

    let orderItems = [];
    let subtotal = 0;

    for (let item of cart.items) {
        const product = await Product.findOne({ "variants._id": item.variantId });

        if (!product) continue;

        const variant = product.variants.find((variant) => {
            return variant._id.toString() === item.variantId.toString();
        });

        if (!variant) continue;

        if (!product.isActive || variant.stock < item.quantity) {
            continue;
        }

        orderItems.push({
            productId: product._id,
            variantId: variant._id,
            productName: product.name,
            color: variant.color,
            storage: variant.storage,
            quantity: item.quantity,
            imgUrl: variant.imgUrls[0],
            orderedPrice: variant.price
        });

        subtotal += variant.price * item.quantity;
    }

    if (orderItems.length === 0) {
        return {
            success: false,
            message: "The items in your cart are currently unavailable."
        }
    }

    return {
        success: true,
        orderItems,
        subtotal
    };
}


exports.totalOrders = async (userId) => {

    return await Order.countDocuments({ userId });
}


exports.getOrders = async (userId, skip, limit) => {

    return await Order.find({ userId }).skip(skip).limit(limit);
}


exports.getOrder = async (orderId, userId) => {

    const order = await Order.findOne({ orderId, userId });

    if (!order) {
        return {
            success: false,
            message: "Order not found."
        }
    }

    return {
        success: true,
        order
    };
}