const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["Lost", "Found"], required: true },
  category: { 
    type: String, 
    enum: ["Electronics", "Stationery", "ID Cards", "Clothing", "Others"],
    required: true
  },
  location: String,
  imageUrl: String,
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: { type: String, enum: ["Active", "Claimed", "Expired"], default: "Active" },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true
  },
  claimRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    requestedAt: { type: Date, default: Date.now }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }
}, { timestamps: true });

module.exports = mongoose.model("LostFound", lostFoundSchema);
