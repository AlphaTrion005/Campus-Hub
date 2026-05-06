const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  roles: [{
    type: String,
    enum: ["Student", "Club Head", "Class Rep", "Teacher", "Event Manager", "Sub-admin", "Admin", "Developer"],
    default: "Student"
  }],

  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
  },

  branch: [{
    type: String,
    enum: ["CSE", "ECE", "CSM"],
  }],

  section: [{
    type: String,
    enum: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
  }],
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
