import User from "../models/Users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sendOtp from "../helper/sendOtp.js";
dotenv.config();


//  Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;

    const existingUser = await User.findOne({ email });

    console.log("LOG FROM SIGNUP",existingUser)

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

        const { code, expires, lastOtpSentAt } = await sendOtp(email);

        existingUser.verificationCodeExpires = expires;
        existingUser.verificationCode = code;
        existingUser.lastOtpSentAt = lastOtpSentAt;
        await existingUser.save();

        return res.status(200).json({
          success: true,
          // redirect to verification mail page
          message: "user already signed up,Verification mail send successfully",
        });
      }
      return res.status(400).json({
        success: false,
        message: "user already registered please login",
      });
    }

      

    const hashedPassword = await bcrypt.hash(password, 10);

    const {code,expires,lastOtpSentAt} = await sendOtp(email)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      city,
      verificationCode: code,
      verificationCodeExpires: expires,
      lastOtpSentAt
    });


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
      // resend code and mail 
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


export const deleteAccount = async(req,res)=>{
  try {
    const { id } = req.params;

    const deletedUser = await  User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Record deleted successfully", deletedUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting record", error: error.message });
  }
};

