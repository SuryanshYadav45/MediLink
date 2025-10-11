import mongoose from "mongoose";
import Chat from "../models/Chat.js";

// ==================== 1. GET ALL CHATS FOR LOGGED-IN USER (SIDEBAR) ====================

export const getUserChats = async (req, res) => {
  try {
    // Extract the logged-in user's ID from request (added by auth middleware)
    const userId = req.user.id.toString();

    // Find all chats where this user is a participant
    // Populate listing details (title, photo) and participant details (name, email, avatar)
    // Sort chats by latest activity (updatedAt)
    const chats = await Chat.find({ participants: userId })
      .populate("listingId", "title photoURL")
      .populate("participants", "name email avatar")
      .sort({ updatedAt: -1 });

    // If no chats are found, return an empty array
    if (!chats.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No chats found.",
      });
    }

    // Format chat data for sidebar display
    const formattedChats = chats.map((chat) => {
      // Identify the "other" user in the chat (not the logged-in one)
      const otherUser = chat.participants.find(
        (p) => p._id.toString() !== userId
      );

      // Retrieve the most recent message from chat
      const lastMessage =
        chat.messages?.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null;

      // Return simplified chat data for UI display
      return {
        chatId: chat._id,
        listingId: chat.listingId?._id,
        listingTitle: chat.listingId?.title || "Untitled Listing",
        participantName: otherUser?.name || "Unknown",
        avatar: otherUser?.avatar || "",
        lastMessage: lastMessage?.text || "No messages yet",
        updatedAt: chat.updatedAt,
      };
    });

    // Respond with all formatted chats
    return res.status(200).json({
      success: true,
      data: formattedChats,
    });
  } catch (error) {
    // Handle unexpected errors gracefully
    console.error(" Error fetching user chats:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch user chats",
    });
  }
};

// ==================== 2. GET CHAT HISTORY FOR A SPECIFIC LISTING ====================

export const getChatHistory = async (req, res) => {
  try {
    // Extract logged-in user's ID and listing ID from request
    const userId = req.user.id.toString();
    const { listingId } = req.params;

    // Validate that the listing ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID.",
      });
    }

    // Find the chat where this user participated for the given listing
    // Populate sender details for each message
    const chat = await Chat.findOne({
      listingId: new mongoose.Types.ObjectId(listingId),
      participants: userId,
    }).populate("messages.senderId", "_id name");

    // If no chat found, inform the user
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "No chats available for this listing.",
      });
    }

    // Normalize messages for frontend compatibility
    // Ensures all senderId values are strings and structure is clean
    const normalizedMessages = chat.messages.map((msg) => ({
      _id: msg._id,
      senderId:
        typeof msg.senderId === "object"
          ? msg.senderId._id.toString()
          : msg.senderId,
      text: msg.text,
      timestamp: msg.timestamp,
    }));

    // Return all formatted messages to the client
    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: normalizedMessages,
    });
  } catch (error) {
    // Handle errors and log them for debugging
    console.error(" Error fetching chat history:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch messages",
    });
  }
};
