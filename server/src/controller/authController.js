import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import generateOtp from "../utils/generateOtp.js";
import { sendVerificationMail } from "../helper/verificationMail.js";
dotenv.config();

export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.isVerified) {
        if (
          existingUser.lastOtpSentAt &&
          Date.now() - existingUser.lastOtpSentAt.getTime() < 60 * 1000
        ) {
          return res.status(429).json({
            success: false,
            message: "Please wait 1 minute before requesting another OTP.",
          });
        }

        const { code, expires, lastOtpSentAt } = await generateOtp(email);
        existingUser.verificationCodeExpires = expires;
        existingUser.verificationCode = code;
        existingUser.lastOtpSentAt = lastOtpSentAt;
        await existingUser.save();
        await sendVerificationMail(email, code);

        return res.status(200).json({
          success: true,
          message:
            "User already signed up, verification mail sent successfully",
        });
      }

      return res.status(400).json({
        success: false,
        message: "User already registered, please login",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { code, expires, lastOtpSentAt } = await generateOtp(email);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      city,
      verificationCode: code,
      verificationCodeExpires: expires,
      lastOtpSentAt,
    });

    await sendVerificationMail(email, code);

    res
      .status(201)
      .json({ message: "Signup successful, please verify your email" });
  } catch (error) {
    console.log("LOG SIGNUP 2", error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "Already verified" });

    if (user.verificationCodeExpires < Date.now()) {
      const { code, expires, lastOtpSentAt } = await generateOtp(email);
      user.verificationCodeExpires = expires;
      user.verificationCode = code;
      user.lastOtpSentAt = lastOtpSentAt;
      await user.save();
      await sendVerificationMail(email, code);

      return res.status(400).json({
        message: "Expired code, new verification has been sent to your email",
      });
    }

    if (user.verificationCode !== parseInt(code)) {
      return res.status(400).json({ message: "Invalid code" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.lastOtpSentAt = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.log("error");
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified)
      return res
        .status(400)
        .json({ message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    console.log("Cookie sent:", res.getHeaders()["set-cookie"]);

    res.json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Record deleted successfully", deletedUser });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error deleting record", error: error.message });
  }
};
