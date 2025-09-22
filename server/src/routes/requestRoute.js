import express from 'express'
const router = express.Router()

import { authMiddleware, isUser } from '../middleware/authmiddleware.js';
import { approveRequest, cancelRequest, completeRequest, createRequest, getMyrequest, getRequestForListing, rejectRequest } from '../controller/RequestController.js';

router.post('/create-request/:listingId', authMiddleware, isUser, createRequest);
router.get('/getrequest-my',authMiddleware,isUser,getMyrequest)
router.get('/listing/:listingId',authMiddleware,isUser,getRequestForListing)
router.put('/:requestId/approve',authMiddleware,isUser,approveRequest)
router.put('/:requestId/cancelled',authMiddleware,isUser,cancelRequest)
router.put('/:requestId/rejected',authMiddleware,isUser,rejectRequest)
router.put('/:requestId/completed',authMiddleware,isUser,completeRequest)


export default router;
