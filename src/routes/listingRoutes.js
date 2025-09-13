import express from 'express'
import {createListing,getAllListings,getListing,updateListingStatus,deleteListing} from '../controller/listingController.js'
import { authMiddleware,isAdminMiddleware } from '../middleware/authmiddleware.js';

const router = express.Router();

// addd auth ,owner middleware 

router.post('/create-listing',authMiddleware,isAdminMiddleware,createListing)
router.get('/get-all-listing',authMiddleware,isAdminMiddleware,getAllListings)
router.get('/get-listing/:id',authMiddleware,isAdminMiddleware,getListing)
router.put('/update-listing-status/:id',authMiddleware,isAdminMiddleware,updateListingStatus)
router.delete('/delete-listing/:id',authMiddleware,isAdminMiddleware,deleteListing)

export default router;