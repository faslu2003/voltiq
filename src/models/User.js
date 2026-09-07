const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: function() {
            return this.authProvider ==="local"
        },
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: function() {
            return this.authProvider === "local"
        }
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
        type: String,
        default: null
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
},
{
    timestamps: true
}
);


const User = mongoose.model('user', userSchema);


module.exports = User;