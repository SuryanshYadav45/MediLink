import express from "express";
const router = express.Router();
import { authMiddleware, isUser} from '../middleware/authmiddleware.js';
import { getLeaderboard, getUserStats, incrementDonated} from "../controller/leaderboardController.js";

router.get("/", getLeaderboard);         
router.get("/user-rank",authMiddleware,isUser, getUserStats);  
router.patch("/increment-donated", authMiddleware,isUser, incrementDonated)




export default router;
