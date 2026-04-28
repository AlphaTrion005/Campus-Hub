const express = require("express");
const Club = require("../models/Club");
const { auth, checkPermission } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { category, search } = req.query;
    const query = { collegeId };

    if (category) query.category = new RegExp(category, "i");
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { requirements: new RegExp(search, "i") },
      ];
    }

    const clubs = await Club.find(query).populate("clubHead", "name").sort("name");
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, checkPermission("manage_own_club"), async (req, res) => {
  try {
    const club = await Club.create({
      ...req.body,
      collegeId: req.user.collegeId,
    });

    res.status(201).json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/apply", auth, async (req, res) => {
  try {
    const club = await Club.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!club) return res.status(404).json({ message: "Club not found" });

    if (!club.applications.some((application) => application.user.toString() === req.user.id)) {
      club.applications.push({ user: req.user.id });
      await club.save();
    }

    res.json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
