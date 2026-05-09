import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"
import User from "../models/auth.models.js";
import generateOTP from '../utilis/otp.js';
import { sendOTPEmail } from '../services/brevo.services.js';

export const registerUser = async (req, res) => {
    //get name, email and password
    const { name, email, password, passwordConfirm } = req.body;

    //check if there is a user with the same email
    const user = await User.findOne({ email });

    //if there is, return error
    if(user) {
        return res.status(400).json({
            success: false,
            message: 'User with this email already exist, please login'
        })
    }

    // //check if passwords match
    // if(password !== passwordConfirm) {
    //     return res.status(400).json({
    //         success: false,
    //         message: 'Passwords do not match'
    //     })
    // }

    //send otp email
    const otp = generateOTP();

    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins

    //if there isn't, create a new user and save it to the database
    const newUser = await User.create({ name, email, password, passwordConfirm, otp, otpExpires });

    await sendOTPEmail(email, otp);

    //use jwt to create a access and refresh token and send it to the client
    const accessToken = jwt.sign({userId: newUser._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1hr'});
    const refreshToken = jwt.sign({userId: newUser._id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '3d'});

    //send a success message to the client
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        newUser,
        accessToken
    })
}

export const signInUser = async (req, res) => {
    //get the username and password from req body
    const { email, password } = req.body;

    //check if the user exist and compare the password for match
    const user = await User.findOne({ email }).select("+password");
    console.log(user);

    if(!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }

    const comparePassword = await bcrypt.compare(password, user.password);

    if(!comparePassword) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or password"
        })
    }
    
    //give new access and refresh token the log the person in.
    const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1hr'});
    const refreshToken = jwt.sign({userId: user._id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '3d'});

    //return a success login message
    res.status(201).json({
        success: true,
        message: "User login successfully",
        user,
        accessToken
    })
}