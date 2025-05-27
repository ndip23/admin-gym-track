const Gym = require('../Modals/gym');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { userName, password, conPassword, gymName, profilePic, email } = req.body;

        // Check if the email already exists
        const isExist = await Gym.findOne({ email });
        if (isExist) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Check if passwords match
        if (password !== conPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        // Encrypt the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const newGym = new Gym({ userName, password: hashedPassword, gymName, profilePic, email });
        await newGym.save();

        res.status(201).json({
            message: 'User registered successfully',
            success: "yes",
            data: newGym
        });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};
const cookieOptions = {
    httpOnly: true,
    secure: false, // input true for production
    sameSite: 'lax'
}

exports.login = async (req, res) => {
    try {
    
        const { userName, password } = req.body; // Change email to userName

        // Find the gym by username
        const gym = await Gym.findOne({ userName }); // Change email to userName
        console.log(gym); // Log the gym object after retrieving it

        // Store the result of bcrypt.compare in a variable
        const isPasswordValid = gym ? await bcrypt.compare(password, gym.password) : false;
        console.log("Is password valid:", isPasswordValid); // Log the comparison result

        if (gym && isPasswordValid) {
            const token = jwt.sign({ gym_id: gym._id }, process.env.JWT_SecretKey);
            res.cookie("cookie_token", token, cookieOptions);

            res.json({ message: 'Logged in successfully', success: "true", gym, token });
        } else {
            return res.status(400).json({ error: "Invalid Credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Basic email validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const gym = await Gym.findOne({ email });

        if (gym) {
            const buffer = crypto.randomBytes(4);
            const token = buffer.readUInt32BE(0) % 900000 + 100000; // Generate a 6-digit OTP
            gym.resetPasswordToken = token;
            gym.resetPasswordExpires = Date.now() + 3600000; // OTP valid for 1 hour
            await gym.save();

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SENDER_EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                }
            });

            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: 'Password Reset',
                text: `You requested a password reset. Your OTP code is ${token}. It is valid for 1 hour.`
            };

            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                    console.error("Error sending email:", error);
                    return res.status(500).json({ error: "Failed to send OTP" });
                }
                res.status(200).json({ message: "OTP sent successfully to your email", success: "true" });
            });
        } else {
            return res.status(400).json({ error: "User not found" });
        }
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.checkOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const gym = await Gym.findOne({ 
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() } // Check if the OTP is still valid
        });

        if (!gym) {
            return res.status(400).json({ error: "Invalid OTP or has expired" });
        }

        // If OTP is valid, respond with a success message
        res.status(200).json({ message: "OTP is successfully verified" });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        const gym = await Gym.findOne({ email });

        if (!gym) {
            return res.status(400).json({ error: "User not found" });
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        gym.password = hashedPassword; // Update password
        gym.resetPasswordToken = undefined; // Clear OTP and expiry
        gym.resetPasswordExpires = undefined; // Clear expiry
        await gym.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};
exports.logout = async (req, res) => {
   res.clearCookie('cookie_token', cookieOptions).json({message: 'Logged out successfully'});
};