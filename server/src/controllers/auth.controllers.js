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

    //send otp email
    const otp = generateOTP();

    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 mins

    //if there isn't, create a new user and save it to the database
    const newUser = await User.create({ name, email, password, passwordConfirm, otp, otpExpires });

    await sendOTPEmail(email, otp);

    //use jwt to create a access and refresh token and send it to the client
    const accessToken = jwt.sign({userId: newUser._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
    const refreshToken = jwt.sign({userId: newUser._id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '3d'});

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

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
    const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
    const refreshToken = jwt.sign({userId: user._id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '3d'});

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });


    //return a success login message
    res.status(201).json({
        success: true,
        message: "User login successfully",
        user,
        accessToken
    })
}

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if(!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }

    if(user.otp !== otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        })
    }

    if(user.otpExpires < Date.now()) {
        return res.status(400).json({
            success: false,
            message: "OTP expired"
        })
    }

    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;

    await user.save();

    res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        user
    })
}


export const me = async (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: "No access token" });
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET
    );

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(401).json({ message: "Refresh expired" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return res.json({ message: "Logged out" });
};