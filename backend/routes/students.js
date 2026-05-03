const express = require("express");
const User = require("../models/User");
const { auth, checkPermission } = require("../middleware/auth");
const { createSearchRegex } = require("../utils/search");

const router = express.Router();

router.get("/", auth, checkPermission("manage_resources"), async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { branch, section, search } = req.query;

    const query = { collegeId, roles: "Student" };

    if (branch) query.branch = branch;
    if (section) query.section = section;
    if (search) {
      const searchRegex = createSearchRegex(search);
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const students = await User.find(query).select("name email branch section roles").sort("name");
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
