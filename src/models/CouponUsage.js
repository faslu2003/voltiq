const mongoose = require('mongoose');


const couponUsageSchema = new mongoose.Schema({
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    usedAt: {
        type: Date
    }
},
{
    timestamps: true
}
);


couponUsageSchema.index({ couponId: 1, orderId: 1}, { unique: true });


const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);


module.exports = CouponUsage;