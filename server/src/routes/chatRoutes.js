import express from 'express'
import { authMiddleware} from '../middleware/authmiddleware.js';
import { getChatHistory } from '../controller/chatController.js';

const router = express.Router();

// addd auth ,owner middleware 
// /chat/:listingId
router.get('/:listingId',authMiddleware,getChatHistory)

export default router;