const User = require('../src/models/User');

const bcrypt = require('bcrypt');



exports.signin = async (body) => {

    const { email, password } = body;

    const user = await User.findOne({ email: email });

    if (!user) {
        return {
            success: false,
            message: "Invalid email or password"
        }
    }

    if (!email) {
        return {
            success: false,
            message: "Please enter your email address"
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Please enter a valid email address"
        }
    }

    if (!password) {
        return {
            success: false,
            message: "Please enter your password"
        }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return {
            success: false,
            message: "Please enter the correct password"
        }
    }

    if (user.role !== "admin") {
        return {
            success: false,
            message: "Invalid email or password"
        }
    }

    return {
        success: true,
        user: user
    }
}


exports.getCustomers = async (page = 1, search) => {

    let filter = {};

    if (search) {
        filter = {
            $or: [
                {
                    fullName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]
        }
    }

    filter.role = "user";

    const limit = 5;
    const skip = (page - 1) * limit;

    const customers = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const totalCustomers = await User.countDocuments({ role: "user" });

    return {
        success: true,
        customers,
        totalCustomers,
        stats: [],
        pagination: {
            from: skip + 1,
            to: Math.min(skip + limit, totalCustomers),
            total: totalCustomers,
            currentPage: page,
            lastPage: Math.ceil(totalCustomers / limit)
        }
    }
}

exports.updateCustomerStatus = async (userId, isBlocked) => {

    let blocked;

    if (isBlocked === "true") {
        blocked = true;
    }
    else {
        blocked = false;
    }

    await User.updateOne({ _id: userId }, { $set: { isBlocked: blocked } });

    return {
        success: true
    }
}