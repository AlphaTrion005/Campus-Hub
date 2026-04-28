const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: String,
  status: { 
    type: String, 
    enum: ["Pending", "In Review", "Resolved"], 
    default: "Pending" 
  },
  isAnonymous: { type: Boolean, default: true },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Typically a Sub-admin or Admin
  },
  updates: [{
    status: String,
    comment: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date, default: Date.now }
  }],
  escalatedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
