import express from "express";
import http from "http";
import { Server } from "socket.io";
import Chat from "../server/src/models/Chat.js";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import { registerSocket } from "./src/controller/RequestController.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Create a new socket.io instance with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend origin
    credentials: true, // Allow cookies to be sent
  },
});

// Register socket instance globally for use in other controllers
registerSocket(io);

// ==================== Socket Authentication Middleware ====================
// This middleware runs before each socket connection is established.
// It verifies the JWT token provided in cookies and attaches user information.

io.use((socket, next) => {
  try {
    // Extract cookies from the socket handshake headers
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies.token; // Token name must match the cookie used in login

    // If token is missing, reject the connection
    if (!token) return next(new Error("No authentication token found"));

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user details to the socket object for later use
    socket.user = { id: decoded.id };

    // Proceed to connection
    next();
  } catch (error) {
    console.error("Socket authentication failed:", error.message);
    next(new Error("Unauthorized: Invalid or expired token"));
  }
});

// ==================== Socket Event Handlers ====================
// Handles connection, joining chat rooms, sending messages, and disconnection events.

io.on("connection", (socket) => {
  // User successfully connected to the socket server

  // Join a chat room based on the listing ID
  socket.on("joinRoom", async ({ listingId }) => {
    // Find the chat associated with the listing
    const chat = await Chat.findOne({ listingId });

    // Ensure the user is one of the participants before joining
    if (!chat || !chat.participants.includes(socket.user.id)) {
      return socket.emit("error", { message: "Access denied to this chat" });
    }

    // Join the socket room associated with the listing
    socket.join(listingId);

    // Send confirmation back to the client
    socket.emit("joinSuccess", { listingId, chatId: chat._id });
  });

  // Handle sending messages in a chat room
  socket.on("sendMessage", async ({ listingId, text }) => {
    const chat = await Chat.findOne({ listingId });

    // Ensure that only valid participants can send messages
    if (!chat || !chat.participants.includes(socket.user.id)) {
      return socket.emit("error", {
        message: "Not authorized to send messages in this chat",
      });
    }

    // Sanitize and limit the message text for security
    const cleanText = text.replace(/<[^>]*>?/gm, "").substring(0, 1000);

    // Construct a new message object
    const message = {
      senderId: socket.user.id,
      text: cleanText,
      timestamp: new Date(),
    };

    // Save message to the chat database
    chat.messages.push(message);
    await chat.save();

    // Broadcast the message to all users in the same room
    io.to(listingId).emit("receiveMessage", message);
  });

  // Handle disconnection events
  socket.on("disconnect", () => {
    // console.log("User disconnected:", socket.user.id);
  });
});

// ==================== Server Startup ====================
// The socket server listens for incoming connections on the specified port.

const SOCKET_PORT = process.env.SOCKET_PORT || 5001;

server.listen(SOCKET_PORT, () => {
  console.log(`Socket server running on port ${SOCKET_PORT}`);
});
