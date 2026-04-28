const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema({
  name: String,
  domain: String,
});

module.exports = mongoose.model("College", collegeSchema);