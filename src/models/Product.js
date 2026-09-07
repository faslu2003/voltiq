const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imgUrls: {
        type: [String],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    highlights: {
        type: [String],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
},
{
    timestamps: true
}
);


const Product = mongoose.model('product', productSchema);


module.exports = Product;