const express = require("express");
const Resource = require("../models/Resource");
const Club = require("../models/Club");
const Report = require("../models/Report");
const Announcement = require("../models/Announcement");
const { auth } = require("../middleware/auth");
const { hasPermission } = require("../utils/roles");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const { collegeId, id, roles } = req.user;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const canManageReports = hasPermission(roles || [], "manage_reports");
    const reportQuery = canManageReports ? { collegeId } : { collegeId, submittedBy: id };

    const [
      newResources,
      activeClubs,
      pendingReports,
      inReviewReports,
      announcements,
    ] = await Promise.all([
      Resource.countDocuments({ collegeId, createdAt: { $gte: since } }),
      Club.countDocuments({ collegeId }),
      Report.countDocuments({ ...reportQuery, status: "Pending" }),
      Report.countDocuments({ ...reportQuery, status: "In Review" }),
      Announcement.find({
        collegeId,
        scope: { $in: ["Campus", "Class", "Subject", "Club", "Event"] },
      })
        .populate("postedBy", "name")
        .sort("-createdAt")
        .limit(5),
    ]);

    res.json({
      stats: {
        newResources,
        activeClubs,
        alerts: pendingReports + inReviewReports,
      },
      announcements,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
