const express = require("express");
const LostFound = require("../models/LostFound");
const { auth } = require("../middleware/auth");
const { hasPermission } = require("../utils/roles");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { type, status, category, search } = req.query;
    const query = { collegeId };

    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
      ];
    }

    const items = await LostFound.find(query).populate("postedBy", "name").sort("-createdAt");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const item = await LostFound.create({
      ...req.body,
      postedBy: req.user.id,
      collegeId: req.user.collegeId,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/claim", auth, async (req, res) => {
  try {
    const item = await LostFound.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.claimRequests.some((claim) => claim.user.toString() === req.user.id)) {
      return res.status(400).json({ message: "Claim request already submitted" });
    }

    item.claimRequests.push({
      user: req.user.id,
      message: req.body.message || "",
    });
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/status", auth, async (req, res) => {
  try {
    const item = await LostFound.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const canUpdate = item.postedBy.toString() === req.user.id || hasPermission(req.user.roles || [], "manage_lost_found");
    if (!canUpdate) return res.status(403).json({ message: "Permission denied" });

    item.status = req.body.status || item.status;
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
