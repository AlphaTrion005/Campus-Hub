const express = require("express");
const Club = require("../models/Club");
const Event = require("../models/Event");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { auth, checkPermission } = require("../middleware/auth");
const { hasPermission } = require("../utils/roles");
const { createSearchRegex } = require("../utils/search");

const router = express.Router();

const canManageAnyClub = (roles = []) => hasPermission(roles, "manage_club_applications");

const canManageClub = (user, club) => {
  if (canManageAnyClub(user.roles || [])) return true;
  return club.clubHead?.toString() === user.id;
};

const buildClubPayload = (body, user) => {
  const payload = {
    name: body.name,
    description: body.description,
    category: body.category,
    requirements: body.requirements,
  };

  if (body.clubHead && canManageAnyClub(user.roles || [])) {
    payload.clubHead = body.clubHead;
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
};

router.get("/", auth, async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { category, search } = req.query;
    const query = { collegeId };

    if (category) query.category = createSearchRegex(category);
    if (search) {
      const searchRegex = createSearchRegex(search);
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { requirements: searchRegex },
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
    const payload = buildClubPayload(req.body, req.user);
    if (!canManageAnyClub(req.user.roles || [])) {
      payload.clubHead = req.user.id;
    }

    const club = await Club.create({
      ...payload,
      collegeId: req.user.collegeId,
    });

    await AuditLog.create({
      action: "CLUB_CREATE",
      category: "Club",
      performedBy: req.user.id,
      details: `Created club: ${club.name}`,
      collegeId: req.user.collegeId
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

router.put("/:id", auth, checkPermission("manage_own_club"), async (req, res) => {
  try {
    const club = await Club.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!club) return res.status(404).json({ message: "Club not found" });
    if (!canManageClub(req.user, club)) return res.status(403).json({ message: "Permission denied" });

    Object.assign(club, buildClubPayload(req.body, req.user));
    await club.save();

    await AuditLog.create({
      action: "CLUB_UPDATE",
      category: "Club",
      performedBy: req.user.id,
      details: `Updated club: ${club.name}`,
      collegeId: req.user.collegeId
    });

    res.json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, checkPermission("manage_own_club"), async (req, res) => {
  try {
    const club = await Club.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!club) return res.status(404).json({ message: "Club not found" });
    if (!canManageClub(req.user, club)) return res.status(403).json({ message: "Permission denied" });

    await Club.deleteOne({ _id: club._id, collegeId: req.user.collegeId });

    await AuditLog.create({
      action: "CLUB_DELETE",
      category: "Club",
      performedBy: req.user.id,
      details: `Deleted club: ${club.name}`,
      collegeId: req.user.collegeId
    });

    res.json({ message: "Club deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/members", auth, async (req, res) => {
  try {
    const club = await Club.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!club) return res.status(404).json({ message: "Club not found" });

    // Assuming club members are users whose role includes 'Club Head' or 'Member' for this club.
    // For simplicity, we fetch accepted applications.
    // Let's assume members are those with 'Approved' applications.
    const approvedApplications = club.applications.filter(app => app.status === "Approved");
    const memberIds = approvedApplications.map(app => app.user);

    const members = await User.find({ _id: { $in: memberIds } }).select("name email roles branch section");
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/events", auth, async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.params.id, collegeId: req.user.collegeId }).sort("-date");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
