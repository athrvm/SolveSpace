const User = require('../models/user');
const validate = require('../utils/validate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const Submission = require("../models/submission")



const register = async (req, res) => {
    // Logic for user registration

    try {
        validate(req.body); // Validate the request body using the validate function from utils/validate.js

        const { firstName, emailId, password } = req.body;

        // Check if a user with the provided email already exists in the database
        // const existingUser = await User.exists({ emailId: emailId});
        // if (existingUser) {
        //     return res.status(400).json({ message: 'User with this email already exists' });
        // }
        // No need of creating this check as we have already defined emailId as unique in the userSchema. So mongoose will take care of this.


        // save password in hased form.
        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'user';

        const user = await User.create(req.body) // Create a new user in the database using the User model

        // create jwt token
        const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: "user" }, process.env.JWT_KEY, { expiresIn: '1h' });
        
        const reply = {
            _id: user._id,
            firstName: user.firstName,
            emailId: user.emailId,
            role: user.role
        }
        
        res.cookie('token', token, { maxAge: 3600000 }); // Set the JWT token in a cookie with a 1-hour expiration time
        res.status(201).json({
            user: reply,
            message: "User registered successfully"
        });

    }
    catch (err) {
        res.status(400).send("Error: " + err);
    }


}


const login = async (req, res) => {
    // console.log("Login request received:", req.body);

    try {
        const { emailId, password } = req.body;

        if (!emailId) {
            throw new Error("Invalid Credentials");
        }

        if (!password) {
            throw new Error("Invalid Credentials");
        }

        const user = await User.findOne({ emailId: emailId }); // Find a user in the database with the provided email
        if (!user) {
            return res.status(400).send("User not found");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password); // Compare the provided password with the hashed password in the database
        if (!isPasswordValid) {
            return res.status(400).send("Invalid Credentials");
        }

        const reply = {
            _id: user._id,
            firstName: user.firstName,
            emailId: user.emailId,
            role: user.role
        }

        const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: user.role }, process.env.JWT_KEY, { expiresIn: '1h' });
        res.cookie('token', token, { maxAge: 3600000 });
        res.status(200).json({
            user: reply,
            message: "User logged in successfully"
        });


    }
    catch (err) {
        res.status(400).send("Error: " + err);
    }
}

const logout = async (req, res) => {

    // Validate token(Created a middleware): Done with userMiddleware.js
    // Add token to Redis blacklist
    // Clear the cookie
    try {
        const { token } = req.cookies;
        const payload = jwt.decode(token);

        await redisClient.set(`token:${token}`, 'Blocked');
        await redisClient.expireAt(`token:${token}`, payload.exp);

        res.cookie("token", null, { expires: new Date(Date.now()) });
        res.send("Logged Out Succesfully");
    }
    catch (err) {
        res.status(503).send("Error: " + err);
    }
}

const adminRegister = async (req, res) => {
    // Logic for admin registration

    try {
        // validate the data;
        //   if(req.result.role!='admin')
        //     throw new Error("Invalid Credentials");  
        validate(req.body);
        const { firstName, emailId, password } = req.body;

        req.body.password = await bcrypt.hash(password, 10);
        // req.body.role = 'admin'; // not using because admin can register both user and admin from this endpoint. So we will take role from the request body. But we will check if the user is admin or not in the middleware.

        const user = await User.create(req.body);
        const token = jwt.sign({ _id: user._id, emailId: emailId, role: user.role }, process.env.JWT_KEY, { expiresIn: 60 * 60 });
        res.cookie('token', token, { maxAge: 60 * 60 * 1000 });
        res.status(201).send("User Registered Successfully");
    }
    catch (err) {
        res.status(400).send("Error: " + err);
    }


}

const deleteProfile = async (req, res) => {

    try {
        const userId = req.result._id;

        // userSchema delete
        await User.findByIdAndDelete(userId);

        // Submission se bhi delete karo...

        // Method - 1 of deleting submissions.
        // await Submission.deleteMany({userId});

        res.status(200).send("Deleted Successfully");

    }
    catch (err) {

        res.status(500).send("Internal Server Error");
    }
}


module.exports = {
    register,
    login,
    logout,
    adminRegister,
    deleteProfile
};