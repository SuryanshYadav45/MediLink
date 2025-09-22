import mongoose  from "mongoose";

const RequestSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // denormalized for quick queries
  prescriptionDoc: { type: String, default: null }, // cloudinary URL, required for medicines
  message: { type: String, default: "" }, // optional message from requester
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled", "completed"],
    default: "pending"
  },
  // track lifecycle timestamps for analytics / UI
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // optional: when the request will auto-expire (e.g., 7 days after created)
  expiresAt: { type: Date, default: null }
});

// keep updatedAt up-to-date
RequestSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// unique index to prevent duplicate pending requests by same requester for same listing
RequestSchema.index({ listingId: 1, requesterId: 1, status: 1 }, { partialFilterExpression: { status: "pending" }, unique: true });

export default mongoose.model("Request", RequestSchema);
