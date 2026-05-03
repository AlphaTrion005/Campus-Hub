const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., "USER_ROLE_UPDATE", "RESOURCE_DELETE"
  category: { type: String, enum: ["User", "Resource", "Event", "LostFound", "Club", "System", "Other"], default: "Other" },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  details: { type: String },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
