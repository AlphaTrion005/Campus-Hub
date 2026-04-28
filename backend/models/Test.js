const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: String,
  date: { type: Date, required: true },
  time: String,
  duration: String, // e.g. "2 hours"
  venue: String,
  maxMarks: Number,
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true
  },
  classId: mongoose.Schema.Types.ObjectId,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Test", testSchema);
