import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Send email helper
const sendVerificationEmail = async (email, code) => {
  try {
    const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MediLink" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your Email",
    text: `Your verification code is: ${code}`,
  });
  } catch (error) {
    console.log("LOG FOR MAIL",error)
  }
};

//  Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;

    const existingUser = await User.findOne({ email });
    console.log("LOG FROM SIGNUP",existingUser)
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000);
    const expires = Date.now() + 60 * 60 * 1000; // 60 min expiry

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      city,
      verificationCode: code,
      verificationCodeExpires: expires,
    });

    await sendVerificationEmail(email, code);

    res.status(201).json({ message: "Signup successful, please verify your email" });
  } catch (error) {
    console.log("LOG SIGNUP 2",error)
    res.status(500).json({ message: error.message });
  }
};

//  Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) return res.status(400).json({ message: "Already verified" });

    if (user.verificationCode !== parseInt(code) || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) return res.status(400).json({ message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Logout
export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};