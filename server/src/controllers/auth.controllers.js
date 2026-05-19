import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"
import User from "../models/auth.models.js";
import generateOTP from '../utilis/otp.js';
import { sendOTPEmail } from '../services/brevo.services.js';
 
const isProd = process.env.NODE_ENV === "production";
 
const cookieOptions = {
  httpOnly: true,
  secure: isProd,           // true in production (required for sameSite: "none")
  sameSite: isProd ? "none" : "lax", // "none" allows cross-origin cookies on GitHub Pages
};
 
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;
 
  const user = await User.findOne({ email });
 
  if (user) {
    const error = new Error("User already exists");
    error.status = 400;
    throw error;
  }
 
  const otp = generateOTP();
  const otpExpires = Date.now() + 5 * 60 * 1000;
 
  const newUser = await User.create({ name, email, password, passwordConfirm, otp, otpExpires });
 
  await sendOTPEmail(email, otp, newUser.name);
 
  const accessToken = jwt.sign({ userId: newUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: newUser._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '3d' });
 
  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 3 * 24 * 60 * 60 * 1000 });
 
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    newUser,
    accessToken
  });
  } catch (error) {
    console.error("Error in registerUser:", error);
    next(error); // Pass the error to the error handling middleware
  }
};

export const signInUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
 
  const user = await User.findOne({ email }).select("+password");
 
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
 
  const comparePassword = await bcrypt.compare(password, user.password);
 
  if (!comparePassword) {
    const error = new Error("Invalid email or password");
    error.status = 400;
    throw error;
  }

 if (user.isVerified !== true) {
   return res.status(400).json({
    success: false,
    message: "Unverified, please verify your account"
   })
 }
 
  const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '3d' });
 
  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 3 * 24 * 60 * 60 * 1000 });
 
  res.status(200).json({
    success: true,
    message: "User login successfully",
    user,
    accessToken
  });
  } catch (error) {
    console.error("Error in signInUser:", error);
    next(error); // Pass the error to the error handling middleware
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
 
  const user = await User.findOne({ email }).select("+otp +otpExpires");
 
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
 
  if (user.otp !== otp) {
    const error = new Error("Invalid OTP");
    error.status = 400;
    throw error;
  }
 
  if (user.otpExpires < Date.now()) {
    const error = new Error("OTP expired");
    error.status = 400;
    throw error;
  }
 
  user.otp = null;
  user.otpExpires = null;
  user.isVerified = true;
 
  await user.save();
 
  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    user
  });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    next(error); // Pass the error to the error handling middleware
  }
};

export const me = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
 
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
 
    return res.json({
      status: true,
      user
    });
  } catch (error) {
    console.error("Error in me:", error);
    next(error); // Pass the error to the error handling middleware
  }
};

export const refreshToken = async (req, res, next) => {
  const token = req.cookies.refreshToken;
 
  if (!token) {
    const error = new Error("No refresh token provided");
    error.status = 401;
    throw error;
  }
 
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
 
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }  // matched to original — was "15m" (mismatch)
    );

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });

    return res.json({ success: true, accessToken });
  } catch (error) {
    console.error("Error in refreshToken:", error);
    next(error); // Pass the error to the error handling middleware
  }
};
 
export const logout = async (req, res, next) => {
  try {
    // clearCookie options must match the options used when setting the cookie
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.json({
      success: true,
      message: "Logged out"
    });
  } catch (error) {
    console.error("Error in logout:", error);
    next(error); // Pass the error to the error handling middleware
  }
};
