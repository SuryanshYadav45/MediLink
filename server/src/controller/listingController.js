import Listings from "../models/Listing.js";
import axios from 'axios'


export const createListing = async (req, res) => {
  try {
    // Basic existence checks
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { title, description, type, expiryDate, location, photoURL } =
      req.body;

    // Validate presence of required fields
    if (!title || !description || !type || !location || !location.city) {
      return res.status(400).json({
        success: false,
        message: "title, description, type and location.city are required",
      });
    }

    // Optional: enforce allowed types
    const allowedTypes = ["medicine", "equipment"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Allowed types",
      });
    }

    // Safe destructure of location
    const city = location.city;
    const lat = location.lat ?? null;
    const lng = location.lng ?? null;

    // Build listingData
    const listingData = {
      ownerId: req.user.id,
      title: typeof title === "string" ? title.trim() : title,
      description:
        typeof description === "string" ? description.trim() : description,
      type,
      photoURL: photoURL ?? null,
      location: { city, lat, lng },
    };

    // If medicine, validate expiryDate and ensure it's a valid future date
    if (type === "medicine") {
      if (!expiryDate) {
        return res.status(400).json({
          success: false,
          message: "expiryDate is required for medicine listings",
        });
      }
      const parsed = new Date(expiryDate);
      if (Number.isNaN(parsed.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid expiryDate format" });
      }
      // Optional: require expiry to be in future
      if (parsed <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "expiryDate must be a future date",
        });
      }
      listingData.expiryDate = parsed;
    }

    // Create
    const createdListing = await Listings.create(listingData);

    return res.status(201).json({
      success: true,
      message: "Listing created successfully",
      data: createdListing.id,
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
      query.expiryDate = { $gt: new Date() };
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
      return res.status(400).json({ error: "Listing not found" });
    }

    if (findListingAndUpdate.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this listing",
      });
    }

    findListingAndUpdate.status = status;
    await findListingAndUpdate.save();
    // Update leaderboard for the owner (they helped someone)
    if(status === 'donated') {
      try {
      await axios.patch(
        "http://localhost:5000/api/leaderboard/increment-donated",
        {},
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (err) {
      console.error("Failed to update leaderboard:", err.message);
    }
    }
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

// update listing
export const updateListing = async (req, res) => {
  try {
    const { title, description, expiryDate, location, photoURL } = req.body;

    const listingId = req.params.id;

    const listing = await Listings.findById(listingId);

    if (listing.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this listing",
      });
    }

    // allow partial updates: only update fields provided
    let updated = false;
    if (title) {
      listing.title = title;
      updated = true;
    }
    if (description) {
      listing.description = description;
      updated = true;
    }
    if (photoURL) {
      listing.photoURL = photoURL;
      updated = true;
    }
    if (location && (location.city || location.lat || location.lng)) {
      listing.location = {
        city: location.city ?? listing.location.city,
        lat: location.lat ?? listing.location.lat,
        lng: location.lng ?? listing.location.lng,
      };
      updated = true;
    }
    if (listing.type === "medicine" && expiryDate) {
      const d = new Date(expiryDate);
      if (isNaN(d))
        return res
          .status(400)
          .json({ success: false, message: "Invalid expiryDate" });
      listing.expiryDate = d;
      updated = true;
    }
    if (!updated)
      return res
        .status(400)
        .json({ success: false, message: "Nothing to update" });

    await listing.save();

    return res.status(200).json({
      message: "Listing updated succesfully",
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
    const userId = req.user.id;

    const deleteListing = await Listings.findOneAndDelete({
      _id: listingId,
      ownerId: userId,
    });
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
