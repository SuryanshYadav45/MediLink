// controllers/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();


// ==================== Generate Cloudinary Upload Signature ====================
// This controller provides a signed payload required for secure direct uploads 
// from the frontend to Cloudinary without exposing the API secret.

export const getUploadSignature = async (req, res) => {
  try {
    // Generate a UNIX timestamp in seconds
    const timestamp = Math.round(new Date().getTime() / 1000);

    // The folder name is passed from the frontend query (for organized storage)
    const { folder } = req.query;

    // Create a secure signature using Cloudinary's utility method
    // The signature is generated using the API secret and the provided parameters
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    // Send the signature and required Cloudinary credentials to the frontend
    return res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
    });
  } catch (error) {
    // Handle and return any errors that occur during signature generation
    return res.status(500).json({
      error: error.message,
    });
  }
};


// Example frontend usage
// fetch("/api/cloudinary/signature?folder=medicines")
