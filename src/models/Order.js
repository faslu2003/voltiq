const mongoose = require('mongoose');


const returnSchema = new mongoose.Schema({
    returnStatus: {
        type: String,
        enum: ["Not Requested", "Requested", "Cancelled", "Approved", "Rejected", "Picked Up", "Received", "Completed"],
        default: "Not Requested"
    },
    reason: {
        type: String
    },
    additionalDetails: {
        type: String
    },
    requestedAt: {
        type: Date
    },
    refundAmount: {
        type: Number,
        min: 0
    },
    refundStatus: {
        type: String,
        enum: ["Pending", "Initiated", "Completed", "Failed"]
    },
    refundMethod: {
        type: String,
        enum: ["Original Payment Method", "VOLTIQ Wallet"]
    }
});


const cancelSchema = new mongoose.Schema({
    cancelStatus: {
        type: String,
        enum: ["Not Requested", "Approved"],
        default: "Not Requested"
    },
    reason: {
        type: String
    },
    requestedAt: {
        type: Date
    },
    refundAmount: {
        type: Number,
        min: 0
    },
    refundStatus: {
        type: String,
        enum: ["Not Applicable", "Pending", "Initiated", "Completed", "Failed"]
    }
})


const orderItemsSchema = new mongoose.Schema({
    productId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        required: true
    },
    storage: {
        type: String
    },
    quantity: {
        type: Number,
        min: 1,
        required: true
    },
    imgUrl: {
        type: String,
        required: true
    },
    orderedPrice: {
        type: Number,
        min: 0,
        required: true
    },
    discountAllocated: {
        type: Number,
        min: 0,
        default: 0
    },
    returnDetails: {
        type: returnSchema,
        default: () => ({})
    },
    cancellationDetails: {
        type: cancelSchema,
        default: () => ({})
    }
});


const shippingAddressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true,
    },
    houseName: {
        type: String,
        required: true
    },
    locality: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    landmark: {
        type: String
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    addressType: {
        type: String,
        required: true
    }
});


const paymentSchema = new mongoose.Schema({
    paymentMethod: {
        type: String,
        enum: ["COD", "Razorpay"],
        required: true
    },
    transactionId: {
        type: String,
        required: function () {
            return this.paymentMethod === "Razorpay"
                && this.paymentStatus === "Paid";
        }
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        required: true
    }
})



const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: {
        type: [orderItemsSchema],
        required: true
    },
    subtotal: {
        type: Number,
        min: 0,
        required: true
    },
    shippingCharge: {
        type: Number
    },
    codCharge: {
        type: Number
    },
    discountAmount: {
        type: Number,
        min: 0
    },
    totalPrice: {
        type: Number,
        min: 0,
        required: true
    },
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    payment: {
        type: paymentSchema,
        required: true
    },
    orderStatus: {
        type: String,
        enum: ["Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"],
        default: "Confirmed",
        required: true
    },
    statusHistory: [{
        status: String,
        updatedAt: Date
    }],
    estimatedDelivery: {
        type: Date
    },
    deliveredAt: {
        type: Date,
        required: function () {
            return this.orderStatus === "Delivered"
        }
    }
},
    {
        timestamps: true
    });



const Order = mongoose.model('order', orderSchema);



module.exports = Order;