const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    imgUrl: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    }
},
{
    timestamps: true
}
);


const Category = mongoose.model('Category', categorySchema);


module.exports = Category;