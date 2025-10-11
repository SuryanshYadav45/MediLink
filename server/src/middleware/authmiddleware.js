import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


// Authentication Middleware
// Verifies the JWT token from cookies or Authorization headers
// Attaches the authenticated user details to the request object for later use
export const authMiddleware = async (req, res, next) => {
  try {
    // Try to read token from cookies
    let token = req.cookies.token;

    // If not found in cookies, try to extract from Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token is found, block access
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token not found. Please log in.",
      });
    }

    let decoded;

    // Verify the token using the secret key
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // If verification fails, return an unauthorized response
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }

  
    req.user = {
      id: decoded.id,
      name: decoded.name || "Anonymous",
      role: decoded.role ,
    };

    // Continue to the next middleware or controller
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong in auth middleware",
      error: error.message,
    });
  }
};


//Admin Authorization Middleware
// Allows access only if the authenticated user has an admin role
export const isAdminMiddleware = async (req, res, next) => {
  try {
    // Check the role attached by the auth middleware
    if (req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Permission denied. This route is for Admin only.",
      });
    }

    // Allow access if user is admin
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong in auth middleware",
      error: error.message,
    });
  }
};


// User Authorization Middleware
// Allows access only if the authenticated user has a regular user role

export const isUser = async (req, res, next) => {
  try {
    // Check the user's role
    if (req.user.role !== "user") {
      return res.status(400).json({
        success: false,
        message: "Permission denied. This route is for regular users only.",
      });
    }

    // Allow access if user has a 'user' role
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong in auth middleware",
      error: error.message,
    });
  }
};
