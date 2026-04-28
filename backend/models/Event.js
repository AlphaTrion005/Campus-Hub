const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  venue: String,
  date: { type: Date, required: true },
  time: String,
  organizer: { type: String, required: true },
  requirements: String,
  category: { type: String, enum: ["Academic", "Cultural", "Sports", "Technical", "Other"] },
  capacity: Number,
  registeredStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  attendance: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  qrCode: String,
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: { type: String, enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"], default: "Upcoming" }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
