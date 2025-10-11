import Leaderboard from "../models/Leaderboard.js";
import mongoose from "mongoose";


// ==================== 1. Get Top 10 Users on Leaderboard ====================

export const getLeaderboard = async (req, res) => {
  try {
    // Fetch leaderboard entries
    // Sort by reputationScore in descending order
    // Limit results to the top 10 users
    const data = await Leaderboard.find()
      .sort({ reputationScore: -1 })
      .limit(10);

    // Send leaderboard data to client
    return res.status(200).json({ success: true, data });
  } catch (error) {
    // Log and return any unexpected errors
    console.error("getLeaderboard error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ==================== 2. Get Current User Leaderboard Stats ====================
// Automatically creates an entry if the user does not exist

export const getUserStats = async (req, res) => {
  try {
    // Extract user details from the authenticated request
    const { id: userId, name } = req.user;

    // Check if the user already exists in the leaderboard
    let user = await Leaderboard.findOne({ userId });

    // If not found, create a new leaderboard record for the user
    if (!user) {
      user = await Leaderboard.create({
        userId,
        name,
        donatedCount: 0,
        reputationScore: 0,
      });
    }

    // If the stored name differs from the current one, update it
    if (user.name !== name) {
      user.name = name;
      await user.save();
    }

    // Calculate the user's rank
    // The rank is based on how many users have a higher reputationScore
    const rank = await Leaderboard.countDocuments({
      reputationScore: { $gt: user.reputationScore },
    });

    // Return user data with computed rank
    res.status(200).json({
      success: true,
      data: { ...user.toObject(), rank: rank + 1 },
    });
  } catch (error) {
    // Handle unexpected errors
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==================== 3. Increment User Donation and Reputation ====================
// Updates the user's stats each time they make a donation

export const incrementDonated = async (req, res) => {
  try {
    // Extract user details from the authenticated request
    const { id: userId, name } = req.user;

    console.log("Incrementing donation for:", name, userId);

    // Update the user's leaderboard record
    // If the record does not exist, create it automatically
    // Increase donatedCount by 1 and reputationScore by 5
    // Update the user's name and timestamp
    const user = await Leaderboard.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        $inc: { donatedCount: 1, reputationScore: 5 },
        $set: { name: name || "Anonymous", lastUpdated: new Date() },
      },
      { new: true, upsert: true }
    );

    console.log("Updated leaderboard entry:", user);

    // Return updated user leaderboard data
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    // Log and return any error
    console.error("incrementDonated error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
