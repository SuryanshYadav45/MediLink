import Chat from "../models/Chat.js";

// GET /chat/:listingId → fetch chat history.

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id
    const listingId = req.params;

    const findChat =await  Chat.findOne(listingId);

    if (!findChat) {
      return res.status(400).json({
        messages: "no chats available",
      });
    }

    if (!findChat.participants == userId) {
      return res.status(400).json({
        messages: "not authorised",
      });
    }

    return res.status(200).json({
      success: true,
      message: "mesage fetched suucesfully",
      findChat,
    });
  } catch (error) {
     return res.status(500).json({
        messages: error.message
      });
  }
};
