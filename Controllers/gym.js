const Gym = require('../Modals/gym');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // Make sure to include this if you're using nodemailer in sendOtp
const jwt = require('jsonwebtoken');

exports.registerGym = async (req, res) => {
    try {
        const { userName, email, gymName, password, profilePic } = req.body;
        if (!userName || !email || !gymName || !password || !profilePic) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }

        const userExist = await Gym.findOne({ email });
        if (userExist) {
            return res.status(422).json({ error: "Email already exists" });
        }

        // Hash the password before saving
        const hashPassword = await bcrypt.hash(password, 10);

        const user = new Gym({ userName, email, gymName, password: hashPassword, profilePic });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Please fill all the fields" });
        }

        const userExist = await Gym.findOne({ email });
        if (!userExist) {
            return res.status(400).json({ error: "Email does not exist" });
        }

        // Compare the hashed password
        const isMatch = await bcrypt.compare(password, userExist.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid password" });
        }

        // Generate a JWT token
        const token = jwt.sign({ userExist_id: userExist._id }, process.env.JWt_SecretKey);
        res.cookie('token', token, cookieOptions);
        res.status(200).json({ message: "Login successful", token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    }
});



exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const gym = await Gym.findOne({ email });
        if (!gym) {
            return res.status(400).json({ error: 'Email not found' });
        }

        // Generate a secure 6-digit OTP
        const buffer = crypto.randomBytes(4);
        const otp = buffer.readUInt32BE(0) % 900000 + 100000; // Generates a 6-digit OTP
        gym.resetPasswordToken = otp;
        gym.resetPasswordExpires = Date.now() + 600000; // OTP valid for 10 minutes
        await gym.save();
           // email sending code
        const mailOptions = {
            from: 'hernandezjaoh19@gmail.com',
            to: email,
            subject: 'Reset your password',
            text: `You requested a password reset. Your OTP is ${otp}`
        };
            //send OTP code to email
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Server error' });
            }
            res.status(200).json({ message: "OTP sent successfully to your email" });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}


    exports.checkOtp = async (req, res) => {
        try {
            const { email, otp } = req.body;
            const gym = await Gym.findOne({ email });
            if (!gym) {
                return res.status(400).json({ error: 'Email not found' });
            }

            if (gym.resetPasswordToken !== otp) {
                return res.status(400).json({ error: 'Invalid OTP' });
            }

            if (gym.resetPasswordExpires < Date.now()) {
                return res.status(400).json({ error: 'OTP expired' });
            }

            res.status(200).json({ message: 'OTP verified successfully' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }


    exports.resetPassword = async (req, res) => {  
        try {
            const { email, newPassword } = req.body;
            const gym = await Gym.findOne({ email });
            if (!gym) {
                return res.status(400).json({ error: 'Email not found' });
            }
            const hashPassword = await bcrypt.hash(newPassword, 10);
            gym.password = hashPassword;
            gym.resetPasswordToken = undefined;
            gym.resetPasswordExpires = undefined;
            await gym.save();
            res.status(200).json({ message: 'Password reset successful' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
    

    exports.logout = async (req, res) => {  
        try {
            res.clearCookie('token', cookieOptions);
            res.status(200).json({ message: 'Logout successful' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }