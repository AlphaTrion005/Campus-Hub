const express = require("express");
const Report = require("../models/Report");
const { auth, checkPermission } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const { collegeId, id, roles } = req.user;
    const { status, category, search } = req.query;
    const query = { collegeId };

    if (!roles.some((role) => ["Admin", "Developer", "Sub-admin"].includes(role))) {
      query.submittedBy = id;
    }
    if (status) query.status = status;
    if (category) query.category = new RegExp(category, "i");
    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    const reports = await Report.find(query)
      .populate("submittedBy", "name")
      .populate("assignedTo", "name")
      .sort("-createdAt");
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const report = await Report.create({
      ...req.body,
      submittedBy: req.user.id,
      collegeId: req.user.collegeId,
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/status", auth, checkPermission("manage_reports"), async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = req.body.status || report.status;
    report.updates.push({
      status: report.status,
      comment: req.body.comment || "",
      updatedBy: req.user.id,
    });
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
