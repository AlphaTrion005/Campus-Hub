const express = require("express");
const Event = require("../models/Event");
const AuditLog = require("../models/AuditLog");
const { auth, checkPermission } = require("../middleware/auth");
const { createSearchRegex } = require("../utils/search");

const router = express.Router();
const eventStatuses = ["Upcoming", "Ongoing", "Completed", "Cancelled"];

router.get("/", auth, async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { status, category, search } = req.query;
    const query = { collegeId };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      const searchRegex = createSearchRegex(search);
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { organizer: searchRegex },
      ];
    }

    const events = await Event.find(query).populate("createdBy", "name").sort("date");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, checkPermission("manage_events"), async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      collegeId: req.user.collegeId,
      createdBy: req.user.id,
    });

    await AuditLog.create({
      action: "EVENT_CREATE",
      category: "Event",
      performedBy: req.user.id,
      details: `Created event: ${event.title}`,
      collegeId: req.user.collegeId
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/register", auth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "Upcoming") return res.status(400).json({ message: "Registration is only open for upcoming events" });
    if (event.capacity && event.registeredStudents.length >= event.capacity) {
      return res.status(400).json({ message: "Event capacity is full" });
    }

    if (!event.registeredStudents.some((studentId) => studentId.toString() === req.user.id)) {
      event.registeredStudents.push(req.user.id);
      await event.save();
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/status", auth, checkPermission("manage_events"), async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (req.body.status && !eventStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid event status" });
    }

    event.status = req.body.status || event.status;
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/register", auth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.registeredStudents = event.registeredStudents.filter((studentId) => studentId.toString() !== req.user.id);
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, checkPermission("manage_events"), async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!event) return res.status(404).json({ message: "Event not found" });

    await AuditLog.create({
      action: "EVENT_DELETE",
      category: "Event",
      performedBy: req.user.id,
      details: `Deleted event: ${event.title}`,
      collegeId: req.user.collegeId
    });

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
