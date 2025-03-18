const Gym = require('../Modals/gym');
const jwt = require('jsonwebtoken');


const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json('Unauthorized: No token provided');
        }
        const decode = jwt.verify(token, process.env.JWt_SecretKey);
        
        req.gym = await Gym.findById(decode.userExist_id).select('-password');
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = auth;