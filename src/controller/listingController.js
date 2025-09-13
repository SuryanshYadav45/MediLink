import Listings from "../models/Listing.js";

// create listings

export const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      expiryDate,
      location: { city, lat, lng },
      photoURL,
    } = req.body;

    const ownerId = req.user.id;

    const listingData = {
      ownerId,
      title,
      description,
      type,
      photoURL,
      location: { city, lat, lng },
    };
    if (type === "medicine" && expiryDate) {
      listingData.expiryDate = expiryDate;
    }

    const Listing = await Listings.create(listingData);

    return res.status(200).json({
      success: true,
      message: "Listing created successfully",
      listingId: Listing._id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// get all listing

export const getAllListings = async (req, res) => {
  try {
    const { type, city, status } = req.query;

    let query = {};
    if (city) query["location.city"] = city;
    if (type) query.type = type;
    if (status) query.status = status;

    if (type === "medicine") {
      query.expiryDate = { $gt: Date.now() };
    }
    const findItem = await Listings.find(query);

    if (findItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No items found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Items found",
      count: findItem.length,
      data: findItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// get listing by id
export const getListing = async (req, res) => {
  try {
    const listingId = req.params.id;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Listing ID is required",
      });
    }

    const findListing = await Listings.findById(listingId);

    if (!findListing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item found successfully",
      data: findListing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// update listing status id

export const updateListingStatus = async (req, res) => {
  try {
    const listingId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    const allowedStatus = ["available", "reserved", "donated"];

    if (!allowedStatus.includes(status)) {
      return res.status(404).json({
        success: false,
        message:
          "Invalid status value. Must be available, reserved, or donated.",
      });
    }

    const findListingAndUpdate = await Listings.findById(listingId);

    if (!findListingAndUpdate) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (findListingAndUpdate.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this listing",
      });
    }

    findListingAndUpdate.status = status;
    await findListingAndUpdate.save();

    // if status is  donated we can update leaderboard ?
    res.json({
      message: "Listing updated successfully",
      listing: findListingAndUpdate,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// delete listing

export const deleteListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const userId = req.user.id

    const deleteListing = await Listings.findOneAndDelete({_id:listingId,ownerId:userId});
    if (!deleteListing) {
      return res.status(400).json({
        success: false,
        message: "Listing not found or you are not authorized to delete it.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
      deleteListing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
