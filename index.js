import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import listingRoutes from "./src/routes/listingRoutes.js";
import Users from "./src/models/Users.js";

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
app.use("/api/auth", authRoutes);
app.use("/api/listing",listingRoutes)


app.get("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await  Users.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Record deleted successfully", deletedUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting record", error: error.message });
  }
});

// DB Connection
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
