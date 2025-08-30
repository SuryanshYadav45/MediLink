// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  city: { type: String },
  reputationScore: { type: Number, default: 0 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },

  // Email Verification fields
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: Number }, 
  verificationCodeExpires: { type: Date }, 
});

export default mongoose.model("User", userSchema);
