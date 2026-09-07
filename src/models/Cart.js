const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    items: [
        {
            variantId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ]
},
    {
        timestamps: true
    }
);


const Cart = mongoose.model('cart', cartSchema);


module.exports = Cart;