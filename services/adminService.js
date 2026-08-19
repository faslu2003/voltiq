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


exports.getCustomers = async (page = 1, search, status, registered) => {

    let filter = { role: "user" };

    if (search) {
        filter.$or = [
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

    if (status === "blocked") {
        filter.isBlocked = true;
    }
    if (status === "unblocked") {
        filter.isBlocked = false;
    }

    if (registered === "this-month") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        filter.createdAt = {
            $gte: startOfMonth
        };
    }
    if (registered === "this-year") {
        const startOfYear = new Date();
        startOfYear.setMonth(0);
        startOfYear.setDate(1);
        startOfYear.setHours(0, 0, 0, 0);
        filter.createdAt = {
            $gte: startOfYear
        };
    }

    const limit = 5;
    const skip = (page - 1) * limit;

    const customers = await User.find(filter).sort({ isBlocked: -1, createdAt: -1 }).skip(skip).limit(limit);

    const totalCustomers = await User.countDocuments(filter);

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

    await User.updateOne({ _id: userId }, { $set: { isBlocked: isBlocked } });

    return {
        success: true
    }
}