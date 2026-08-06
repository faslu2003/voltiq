const User = require('../src/models/User');



exports.getCustomers = async (page = 1) => {

    const limit = 5;
    const skip = (page - 1) * limit;

    const customers = await User.find().skip(skip).limit(limit);

    const totalCustomers = await User.countDocuments();

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