import express from 'express'
import http from 'http'
import {Server} from 'socket.io'
import Chat from '../server/src/models/Chat.js'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config()
import connectDB from "./src/config/db.js";
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// Socket auth middleware
io.use((socket, next) => {
   const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.user = { id: decoded.id };
  next();
});

// Socket events
io.on("connection", (socket) => {
    console.log("Connected:", socket.user.id)
    socket.on("joinRoom", async ({listingId}) => {
    // console.log("listing id ",listingId);
    // const listingId=data.listingId
    const chat = await Chat.findOne({ listingId });
    console.log("chat",chat);
    
    if (!chat || !chat.participants.includes(socket.user.id)) {
      return socket.emit("error", { message: "Not allowed" });
    }
    socket.join(listingId);
    socket.emit("joinSuccess", { listingId, chatId: chat._id });
  });
   socket.on("sendMessage", async ({ listingId, text }) => {
    const chat = await Chat.findOne({ listingId });
    if (!chat || !chat.participants.includes(socket.user.id)) {
      return socket.emit("error", { message: "Forbidden" });
    }

    const cleanText = text.replace(/<[^>]*>?/gm, "").substring(0, 1000);
     const message = {
      senderId: socket.user.id,
      text: cleanText,
      timestamp: new Date()
    };  

    chat.messages.push(message);
    await chat.save();

    io.to(listingId).emit('receiveMessage', message);
  });

  socket.on("disconnect", () => {
    console.log(" Disconnected:", socket.user.id);
  });
    
})


const SOCKET_PORT = process.env.SOCKET_PORT || 5001;
server.listen(SOCKET_PORT, () => {
  console.log(`Socket server running on port ${SOCKET_PORT}`);
});

