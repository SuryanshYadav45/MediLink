import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import listingRoutes from "./src/routes/listingRoutes.js";
import requestRoutes from "./src/routes/requestRoute.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import leaderBoardRoutes from "./src/routes/leaderBoardRoute.js";



dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, 
  })
);

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/listing",listingRoutes)
app.use('/api/request',requestRoutes)
app.use('/api/chat',chatRoutes)
app.use('/api/leaderboard',leaderBoardRoutes)



// DB Connection
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
