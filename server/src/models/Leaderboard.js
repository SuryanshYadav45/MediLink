import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  donatedCount: { type: Number, default: 0 },
  helpedCount: { type: Number, default: 0 },
  reputationScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

leaderboardSchema.index({ donatedCount: -1 });
leaderboardSchema.index({ reputationScore: -1 });

export default mongoose.model("Leaderboard", leaderboardSchema);
