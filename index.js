const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config(); 

const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not set

app.use(express.json());
app.use(cookieParser());

require('./DBConnect/connect'); // Ensure your DB connection is working

const GymRoutes = require('./Routes/gym');
const MembershipRoutes = require('./Routes/membership');

app.use('/auth', GymRoutes);
app.use('/membership', MembershipRoutes);

app.listen(PORT, () => {
    console.log('Server is running on port 4000');
});