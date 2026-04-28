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
});

module.exports = mongoose.model("User", userSchema);