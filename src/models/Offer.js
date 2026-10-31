const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    offerType: {
        type: String,
        required: true,
        enum: ["product", "category", "storewide"]
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: function() {
            return this.offerType === "product";
        }
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: function() {
            return this.offerType === "category";
        }
    },
    discountType: {
        type: String,
        required: true,
        enum: ["flat", "percentage"]
    },
    discountValue: {
        type: Number,
        validate: {
            validator(value) {
                return value > 0
            },
            message: "Minimum discount value should be greater than 0."
        },
        max: function() {
            if (this.discountType === "percentage") {
                return 100;
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
            message: "Maximum discount should be greater than 0."
        }
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator(value) {
                return value > this.startDate;
            },
            message: "The end date should be later than the start date."
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


const Offer = mongoose.model('Offer', offerSchema);


module.exports = Offer;