const mongoose = require('mongoose');


const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    variants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    ]
},
    {
        timestamps: true
    }
);


const Wishlist = mongoose.model('Wishlist', wishlistSchema);


module.exports = Wishlist;