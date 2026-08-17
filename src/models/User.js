const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: Number,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "user"
    },
    profileImgUrl: {
        type: String
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    authProvider: {
        type: String,
        default: "local" // "local" or "google"
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    }
},
{
    timestamps: true
}
);


const User = mongoose.model('user', userSchema);


module.exports = User;