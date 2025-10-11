import mongoose from "mongoose";

// ==================== Request Schema ====================
// Represents a donation or help request made by a user for a particular listing.
// This model links the requester, the owner, and the listing together.

const RequestSchema = new mongoose.Schema({
  // Reference to the listing being requested
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },

  // User who created the request
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Owner of the listing being requested (duplicated for faster queries)
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Cloudinary URL for prescription document, required only for medicine-type listings
  prescriptionDoc: { type: String, default: null },

  // Optional message provided by the requester during request creation
  message: { type: String, default: "" },

  // Status field tracks the current stage of the request
  // Possible statuses:
  // - pending: newly created and awaiting owner action
  // - approved: accepted by the owner
  // - awaiting_confirmation: donation marked as sent by the owner
  // - completed: confirmed as received by the requester
  // - rejected: declined by the owner
  // - cancelled: withdrawn by the requester
  status: {
    type: String,
    enum: [
      "pending",
      "approved",
      "awaiting_confirmation",
      "completed",
      "rejected",
      "cancelled",
    ],
    default: "pending",
  },

  // Date when the request was created
  createdAt: { type: Date, default: Date.now },

  // Date when the request was last updated
  updatedAt: { type: Date, default: Date.now },

  // Optional field to indicate when the request should expire automatically
  // For example, a request could auto-expire after 7 days
  expiresAt: { type: Date, default: null },
});


// ==================== Middleware ====================
// Automatically update the "updatedAt" timestamp before each save operation

RequestSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});


// ==================== Indexes ====================
// Prevent multiple pending requests for the same listing from the same requester
// Uses a partial index to only enforce uniqueness for requests in "pending" status

RequestSchema.index(
  { listingId: 1, requesterId: 1, status: 1 },
  { partialFilterExpression: { status: "pending" }, unique: true }
);


// Export the Request model for use in controllers
export default mongoose.model("Request", RequestSchema);
