const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        uppercase: true,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    discountType: {
        type: String,
        enum: ["flat", "percentage"],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        validate: {
            validator(value) {
                return value > 0;
            }
        },
        max: function() {
            if (this.discountType === "percentage") {
                return 100;
            }
        }
    },
    minimumPurchase: {
        type: Number,
        validate: {
            validator(value) {
                return value >= 0;
            }
        },
        required: true
    },
    maximumDiscount: {
        type: Number,
        validate: {
            validator(value) {
                return value > 0;
            },
            message: "Maximum discount amount should be greater than 0."
        }
    },
    usageLimit: {
        type: Number,
        validate: {
            validator(value) {
                return value > 0;
            },
            message: "Coupon usage limit should be greater than 0."
        },
        required: true
    },
    perUserLimit: {
        type: Number,
        min: 1,
        required: true,
    },
    usedCount: {
        type: Number,
        min: 0,
        default: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true,
        validate: {
            validator(value) {
                return value > this.startDate;
            },
            message: "The expiry date should be later than the start date."
        }
    },
    isActive: {
        type: Boolean,
        required: true
    }
},
{
    timestamps: true
}
);


const Coupon = mongoose.model('Coupon', couponSchema);


module.exports = Coupon;