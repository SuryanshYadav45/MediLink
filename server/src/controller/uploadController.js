// controllers/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

export const getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const { folder } = req.query;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

// Example Frontend Call
// fetch("/api/cloudinary/signature?folder=medicines")
