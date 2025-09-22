import Leaderboard from "../models/Leaderboard.js";6

// Get leaderboard stats
export const getLeaderboard = async (req, res) => {
  try {
   const data = await Leaderboard.find()
    .sort({reputationScore: -1})
    .limit(10);

   return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Get leaderBoard/:id 
export const getUserStats = async (req, res) => {
  try {
   const userId = req.user.id;

  // find user in leaderboard 
   const user = await Leaderboard.findOne({ userId })
   if(!user) {
    return res.status(400).json({ message: "User"});
   }

  //  compute rank
   const rank = await Leaderboard.countDocuments({ reputationScore: { $gt: user.reputationScore } });
   return res.status(200).json({
    ...user.toObject(),
    rank: rank + 1
   })
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// PATCH increment/donated
export const incrementDonated = async (req, res) => {
  try {
    const userId  = req.user.id;

    const user = await Leaderboard.findOneAndUpdate(
      { userId },
      {
        $inc: { donatedCount: 1, reputationScore: 5 },
        $set: { lastUpdated: new Date() }
      },
      { new: true, upsert: true } // create if not exist
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /approves
export const incrementHelped = async (req, res) => {
  try {
     const userId  = req.user.id;

    const user = await Leaderboard.findOneAndUpdate(
      { userId } ,
      {
        $inc: { helpedCount: 1, reputationScore: 5 },
        $set: { lastUpdated: new Date() }
      },
      { new: true, upsert: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

