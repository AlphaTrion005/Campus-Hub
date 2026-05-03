const express = require("express");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const { auth, checkPermission } = require("../middleware/auth");
const { createSearchRegex } = require("../utils/search");

const router = express.Router();
const reportStatuses = ["Pending", "In Review", "Resolved"];

router.get("/", auth, async (req, res) => {
  try {
    const { collegeId, id } = req.user;
    const roles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const { status, category, search } = req.query;
    const query = { collegeId };

    if (!roles.some((role) => ["Admin", "Developer", "Sub-admin"].includes(role))) {
      query.submittedBy = id;
    }
    if (status) query.status = status;
    if (category) query.category = createSearchRegex(category);
    if (search) {
      const searchRegex = createSearchRegex(search);
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
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

    await AuditLog.create({
      action: "REPORT_CREATE",
      category: "Other",
      performedBy: req.user.id,
      details: `Submitted report: ${report.title}`,
      collegeId: req.user.collegeId
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

    if (req.body.status && !reportStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid report status" });
    }

    report.status = req.body.status || report.status;
    report.updates.push({
      status: report.status,
      comment: req.body.comment || "",
      updatedBy: req.user.id,
    });
    await report.save();

    await AuditLog.create({
      action: "REPORT_UPDATE",
      category: "Other",
      performedBy: req.user.id,
      details: `Updated report status to: ${report.status}`,
      collegeId: req.user.collegeId
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
