const mongoose = require('mongoose');


const returnSchema = new mongoose.Schema({
    returnStatus: {
        type: String,
        enum: ["Not Requested", "Requested", "Approved", "Rejected", "Picked Up", "Received", "Completed"],
        default: "Not Requested",
        required: true
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
        enum: ["Pending", "Initiated", "Completed", "Failed"],
        default: "Pending"
    }
});

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
    returnDetails: {
        type: returnSchema,
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
        required: function() {
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
    otherCharges: {
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
        enum: ["Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned"],
        default: "Confirmed",
        required: true
    },
    estimatedDelivery: {
        type: Date
    }
}, 
{
    timestamps: true
});


const Order = mongoose.model('order', orderSchema);


module.exports = Order;