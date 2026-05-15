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
 
export const registerUser = async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body;
 
  const user = await User.findOne({ email });
 
  if (user) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exist, please login'
    });
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
};
 
export const signInUser = async (req, res) => {
  const { email, password } = req.body;
 
  const user = await User.findOne({ email }).select("+password");
 
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }
 
  const comparePassword = await bcrypt.compare(password, user.password);
 
  if (!comparePassword) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password"
    });
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
};
 
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
 
  const user = await User.findOne({ email }).select("+otp +otpExpires");
 
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }
 
  if (user.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });
  }
 
  if (user.otpExpires < Date.now()) {
    return res.status(400).json({
      success: false,
      message: "OTP expired"
    });
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
};
 
export const me = async (req, res) => {
  try {
    const { userId } = req.user;
    console.log("Authenticated user ID:", userId);
    
    const user = await User.findById(userId);
 
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }
 
    return res.json({
      status: true,
      user
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
 
export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
 
  console.log("Refresh attempt, token present:", token);
 
  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
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
  } catch (err) {
    return res.status(401).json({ message: "Refresh expired" });
  }
};
 
export const logout = async (req, res) => {
  // clearCookie options must match the options used when setting the cookie
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
 
  return res.json({ message: "Logged out" });
};