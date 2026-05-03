const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema({
  name: String,
  domain: String,
  settings: {
    maintenanceMode: { type: Boolean, default: false },
    allowRegistrations: { type: Boolean, default: true },
    allowGuestView: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("College", collegeSchema);