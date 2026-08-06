const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true,
        unique: true
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
    cityState: {
        type: String,
        required: true
    }
},
{
    timestamps: true
}
);


const Address = mongoose.model('address', addressSchema);


module.exports = Address;