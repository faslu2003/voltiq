const User = require('../src/models/User');

const bcrypt = require('bcrypt');



exports.signup = async (body) => {

    const { fullName, email, phoneNumber, password, confirmPassword } = body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return {
            success: false,
            message: "An account with this email already exists"
        };
    }

    if (!fullName) {
        return {
            success: false,
            message: "Please enter your full name"
        }
    }

    if (!email) {
        return {
            success: false,
            message: "Please enter your email address"
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Please enter a valid email address"
        }
    }

    if (!phoneNumber) {
        return {
            success: false,
            message: "Please enter your phone number"
        }
    }

    if (!password) {
        return {
            success: false,
            message: "Please enter your password"
        }
    }

    if (!confirmPassword) {
        return {
            success: false,
            message: "Please confirm your password"
        }
    }

    if (password !== confirmPassword) {
        return {
            success: false,
            message: "Passwords do not match"
        }
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,}$/;

    if (!passwordRegex.test(password)) {
        return {
            success: false,
            message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character"
        }
    }

    function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    const otp = generateOTP();
    console.log("OTP:", otp);

    return {
        success: true,
        pendingUser: {
            fullName,
            email,
            phoneNumber,
            password
        },
        otp,
        otpExpiry: Date.now() + 3 * 60 * 1000
    }
}


exports.signupVerification = async (body, session) => {

    const enteredOTP = Object.values(body).join("");

    if (Date.now() > session.otpExpiry) {
        return {
            success: false,
            message: "OTP has expired"
        }
    }

    if (enteredOTP !== session.otp) {
        return {
            success: false,
            message: "Entered OTP is invalid"
        }
    }

    if (!session.pendingUser) {
        return {
            success: false,
            message: "Signup session expired. Please sign up again"
        }
    }

    const { fullName, email, phoneNumber, password } = session.pendingUser;

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        fullName,
        email,
        phoneNumber,
        password: hashedPassword
    });

    delete session.pendingUser;
    delete session.otp;
    delete session.otpExpiry;

    return {
        success: true,
        message: "Account created successfully"
    }
}


exports.signin = async (body) => {

    const { email, password } = body;

    const user = await User.findOne({ email: email });

    if (!user) {
        return {
            success: false,
            message: "Invalid email or password"
        }
    }

    if (user.role !== "user") {
        return {
            success: false,
            message: "Unauthorized access"
        }
    }

    if (!email) {
        return {
            success: false,
            message: "Please enter your email address"
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "Please enter a valid email address"
        }
    }

    if (!password) {
        return {
            success: false,
            message: "Please enter your password"
        }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return {
            success: false,
            message: "Please enter the correct password"
        }
    }

    if (user.isBlocked) {
        return {
            success: false,
            message: "Your account has been blocked. Please contact support"
        }
    }

    return {
        success: true,
        user
    }
}


exports.resetPassword = async (body) => {

    const { email } = body;

    const user = await User.findOne({ email: email });

    if (!user) {
        return {
            success: false,
            message: "The entered email is incorrect"
        }
    }

    return {
        success: true,
        message: "Reset link has been sent to your email"
    }
}