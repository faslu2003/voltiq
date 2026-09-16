const mongoose = require('mongoose');


const variantSchema = new mongoose.Schema({
    color: {
        type: String,
        required: true
    },
    storage: {
        type: String,
        required: true
    },
    additionalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    imgUrls: {
        type: [String],
        required: true
    }
});


const productSchema = new mongoose.Schema({
    name: {
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
    basePrice: {
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
        // required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    variants: {
        type: [variantSchema],
        required: true
    }
},
{
    timestamps: true
}
);


const Product = mongoose.model('Product', productSchema);


module.exports = Product;