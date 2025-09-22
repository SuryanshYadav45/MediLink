// controller/RequestController.js
import Request from "../models/Request.js";
import Listing from "../models/Listing.js";
import Chat from "../models/Chat.js";
import axios from 'axios'


export const createRequest = async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const requesterId = req.user.id;

    if (!requesterId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: no authenticated user" });
    }

    const { prescriptionDoc, message } = req.body;

    // fetch whether listing exists
    const existingList = await Listing.findById(listingId);
    if (!existingList) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const ownerId = existingList.ownerId;
    // optional: ensure requester is not the owner
    if (String(ownerId) === requesterId) {
      return res
        .status(400)
        .json({ error: "Owner cannot create a request on their own listing" });
    }

    // if listing requires prescription ensure it's provided
    if (existingList.type === "medicine" && !prescriptionDoc) {
      return res
        .status(400)
        .json({ error: "prescriptionDoc is required for medicine listings" });
    }

    const requestObject = {
      listingId,
      requesterId,
      ownerId,
      message: message || "",
    };

    if (existingList.type === "medicine") {
      requestObject.prescriptionDoc = prescriptionDoc;
    }

    const request = await Request.create(requestObject);

    return res.status(201).json({
      success: true,
      message: "Request created successfully",
      request,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyrequest = async (req, res) => {
  try {
    const { role } = req.query;

    const userId = req.user.id;

    let filter = {};

    if (role === "requester") {
      filter.requesterId = userId;
    } else if (role === "owner") {
      filter.ownerId = userId;
    } else {
      filter.$or = [{ ownerId: userId }, { requesterId: userId }];
    }

    if (!userId) {
      return res.status(400).json({ message: "Missing userId in query" });
    }

    // Find requests where userId is either owner or requester
    const requests = await Request.find(filter);

    if (!requests || requests.length === 0) {
      return res
        .status(404)
        .json({ message: "No requests found for this user" });
    }

    return res.status(200).json({
      message: "Requests fetched successfully",
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /requests/listing/:listingId
export const getRequestForListing = async (req, res) => {
  {
    try {
      const { listingId } = req.params;

      if (!listingId) {
        return res.status(400).json({ message: "please provide listing id" });
      }
      // fetch request regard listing
      const requests = await Request.find({ listingId });

      if (!requests || requests.length == 0) {
        return res.status(400).json({ message: "no request available" });
      }
      return res
        .status(200)
        .json({
          success: true,
          message: "request fetched succesfully",
          requests,
        });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

// PUT /requests/:id/approve
export const approveRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const getRequest = await Request.findById(requestId);
    // console.log(getRequest);

    if (String(getRequest.ownerId) !== String(userId)) {
      return res.status(400).json({ message: "not authorised" });
    }

    // update status to approved
    getRequest.status = "approved";
    await getRequest.save();

    // Update leaderboard for the owner (they helped someone)
    try {
      await axios.patch(
        "http://localhost:5000/api/leaderboard/increment-helped",
        {},
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (err) {
      console.error("Failed to update leaderboard:", err.message);
    }

    const chat = await Chat.findOneAndUpdate(
      { listingId: getRequest.listingId },
      {
        $setOnInsert: {
          listingId: getRequest.listingId,
          participants: [getRequest.ownerId, getRequest.requesterId],
          messages: [],
        },
      },
      { upsert: true, new: true }
    );
    return res
      .status(200)
      .json({ message: "request approved", request: getRequest, chat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /requests/:id/cancel
export const cancelRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const getRequest = await Request.findById(requestId);
    console.log(getRequest);

    if (String(getRequest.requesterId) !== String(userId)) {
      return res.status(400).json({ message: "not authorised" });
    }

    // update status to approved
    getRequest.status = "cancelled";
    await getRequest.save();
    return res
      .status(200)
      .json({ message: "request cancelled", request: getRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const getRequest = await Request.findById(requestId);
    console.log(getRequest);

    if (String(getRequest.ownerId) !== String(userId)) {
      return res.status(400).json({ message: "not authorised" });
    }

    // update status to approved
    getRequest.status = "rejected";
    await getRequest.save();
    return res
      .status(200)
      .json({ message: "request rejected", request: getRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const getRequest = await Request.findById(requestId);
    console.log(getRequest);

    if (String(getRequest.ownerId) !== String(userId)) {
      return res.status(400).json({ message: "not authorised" });
    }

    // update status to approved
    getRequest.status = "completed";
    await getRequest.save();
    // Update leaderboard for the owner (they donated)
    try {
      await axios.patch(
        "http://localhost:5000/api/leaderboard/increment-donated",
        {},
        { headers: { Authorization: req.headers.authorization } }
      );
    } catch (err) {
      console.error("Failed to update leaderboard:", err.message);
    }
    return res
      .status(200)
      .json({ message: "request completed", request: getRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
