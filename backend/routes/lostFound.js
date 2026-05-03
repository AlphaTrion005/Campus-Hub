const express = require("express");
const LostFound = require("../models/LostFound");
const AuditLog = require("../models/AuditLog");
const { auth } = require("../middleware/auth");
const { hasPermission } = require("../utils/roles");
const { createSearchRegex } = require("../utils/search");

const router = express.Router();
const itemStatuses = ["Active", "Claimed", "Expired"];

router.get("/", auth, async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { type, status, category, search } = req.query;
    const query = { collegeId };

    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      const searchRegex = createSearchRegex(search);
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
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
      activityLog: [{ action: "CREATED", performedBy: req.user.id }]
    });

    await AuditLog.create({
      action: "LOST_FOUND_CREATE",
      category: "LostFound",
      performedBy: req.user.id,
      details: `Posted item: ${item.title} (${item.type})`,
      collegeId: req.user.collegeId
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
    if (item.status !== "Active") {
      return res.status(400).json({ message: "Only active items can be claimed" });
    }
    if (item.postedBy.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot claim your own item" });
    }

    if (item.claimRequests.some((claim) => claim.user.toString() === req.user.id)) {
      return res.status(400).json({ message: "Claim request already submitted" });
    }

    item.claimRequests.push({
      user: req.user.id,
      message: req.body.message || "",
    });
    item.activityLog.push({ action: "CLAIM_REQUESTED", performedBy: req.user.id });
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

    if (req.body.status && !itemStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid lost and found status" });
    }

    item.status = req.body.status || item.status;
    item.activityLog.push({ action: `STATUS_UPDATED_${item.status.toUpperCase()}`, performedBy: req.user.id });
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const item = await LostFound.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const canDelete = item.postedBy.toString() === req.user.id || hasPermission(req.user.roles || [], "manage_lost_found");
    if (!canDelete) return res.status(403).json({ message: "Permission denied" });

    await LostFound.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: "LOST_FOUND_DELETE",
      category: "LostFound",
      performedBy: req.user.id,
      details: `Deleted item: ${item.title}`,
      collegeId: req.user.collegeId
    });

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/log", auth, async (req, res) => {
  try {
    const item = await LostFound.findOne({ _id: req.params.id, collegeId: req.user.collegeId }).populate("activityLog.performedBy", "name");
    if (!item) return res.status(404).json({ message: "Item not found" });

    const canView = hasPermission(req.user.roles || [], "manage_lost_found");
    if (!canView) return res.status(403).json({ message: "Permission denied" });

    res.json(item.activityLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
