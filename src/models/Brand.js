const mongoose = require('mongoose');


const brandSchema = new mongoose.Schema({
    brandName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    logoUrl: {
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



const Brand = mongoose.model('Brand', brandSchema);


module.exports = Brand;