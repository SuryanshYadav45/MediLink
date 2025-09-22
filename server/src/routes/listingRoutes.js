import express from 'express'
import {createListing,getAllListings,getListing,updateListingStatus,deleteListing, updateListing} from '../controller/listingController.js'
import { authMiddleware, isUser } from '../middleware/authmiddleware.js';

const router = express.Router();

// addd auth ,owner middleware 

router.post('/create-listing',authMiddleware,isUser,createListing)
router.get('/get-all-listing',authMiddleware,getAllListings)
router.get('/get-listing/:id',authMiddleware,getListing)
router.patch('/update-listing-status/:id',authMiddleware,updateListingStatus)
router.put('/update-listing/:id',authMiddleware,isUser,updateListing)
router.delete('/delete-listing/:id',authMiddleware,isUser,deleteListing)

export default router;