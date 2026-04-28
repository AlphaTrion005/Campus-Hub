const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  scope: { 
    type: String, 
    enum: ["Campus", "Class", "Subject", "Club", "Event"], 
    required: true 
  },
  targetId: { type: mongoose.Schema.Types.ObjectId }, // ID of Class, Club, or Event
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Announcement", announcementSchema);
