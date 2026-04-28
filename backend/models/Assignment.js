const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: String,
  dueDate: { type: Date, required: true },
  maxMarks: Number,
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: true
  },
  classId: mongoose.Schema.Types.ObjectId, // Optional for department/class targeting
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fileUrl: String,
    submittedAt: { type: Date, default: Date.now },
    grade: String
  }]
}, { timestamps: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
