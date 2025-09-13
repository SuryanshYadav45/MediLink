import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const authMiddleware = async (req, res, next) => {
  try {
    
    
    const token = req.cookies.token;
    

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token not found. Please log in.",
      });
    }
    let decode;
    try {
      decode = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }
    // attach info to request
    req.user = decode;
    
    // next middleware
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong in auth middleware",
      error: error.message,
    });
  }
};

// admin authorization only

export const isAdminMiddleware = async (req, res, next) => {
  try {
    
    if (req.user.role != "admin") {
      return res.status(400).json({
        success: false,
        message: "Permission denied, This is protected route for Admin only.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong in auth middleware",
      error: error.message,
    });
  }
};

// only user authorization
export const isUser = async (req, res, next) => {
  try {
    if (req.user.role != "user") {
      return res.status(400).json({
        success: false,
        message:
          "Permission denied, This is protected route for user only.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong in auth middleware",
      error: error.message,
    });
  }
};


