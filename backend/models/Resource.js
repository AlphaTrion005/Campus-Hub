const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ["Timetable", "Exam Schedule", "Note", "Assignment", "Writing Material", "Previous Paper"],
    required: true 
  },
  subject: String,
  semester: String,
  branch: String,
  section: String,
  year: String,
  fileUrl: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true
  },
  version: { type: Number, default: 1 },
  history: [{
    version: Number,
    fileUrl: String,
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Resource", resourceSchema);
