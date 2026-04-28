const express = require("express");
const Event = require("../models/Event");
const Assignment = require("../models/Assignment");
const Test = require("../models/Test");
const { auth, checkRole } = require("../middleware/auth");

const router = express.Router();
const scheduleManagers = ["Developer", "Admin", "Sub-admin"];

const colors = {
  Event: "#3b82f6",
  Assignment: "#10b981",
  Test: "#f59e0b",
};

const toScheduleItem = (item, type) => {
  const date = type === "Assignment" ? item.dueDate : item.date;
  return {
    id: item._id,
    title: item.title,
    description: item.description,
    date,
    time: item.time,
    type,
    subject: item.subject,
    venue: item.venue,
    duration: item.duration,
    maxMarks: item.maxMarks,
    organizer: item.organizer,
    category: item.category,
    capacity: item.capacity,
    status: item.status,
    color: colors[type],
  };
};

const buildDate = (date, time) => {
  if (!date) return undefined;
  return new Date(time ? `${date}T${time}` : date);
};

// Get all schedule items for the user
router.get("/", auth, async (req, res) => {
  try {
    const { collegeId } = req.user;

    // Fetch Events (all for college)
    const events = await Event.find({ collegeId, date: { $gte: new Date() } });

    // Fetch Assignments (all for college - in real app, filter by class/subject)
    const assignments = await Assignment.find({ collegeId, dueDate: { $gte: new Date() } });

    // Fetch Tests
    const tests = await Test.find({ collegeId, date: { $gte: new Date() } });

    // Combine and format
    const schedule = [
      ...events.map(e => toScheduleItem(e, "Event")),
      ...assignments.map(a => toScheduleItem(a, "Assignment")),
      ...tests.map(t => toScheduleItem(t, "Test"))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, checkRole(scheduleManagers), async (req, res) => {
  try {
    const { type, title, description, date, time, subject, venue, duration, maxMarks, organizer, category, capacity } = req.body;
    const scheduleDate = buildDate(date, time);

    if (!type || !title || !scheduleDate) {
      return res.status(400).json({ message: "Type, title, and date are required" });
    }

    let created;
    if (type === "Event") {
      created = await Event.create({
        title,
        description,
        venue,
        date: scheduleDate,
        time,
        organizer: organizer || "Campus Administration",
        category: category || "Other",
        capacity,
        collegeId: req.user.collegeId,
        createdBy: req.user.id,
      });
    } else if (type === "Assignment") {
      created = await Assignment.create({
        title,
        description,
        subject,
        dueDate: scheduleDate,
        maxMarks,
        collegeId: req.user.collegeId,
        createdBy: req.user.id,
      });
    } else if (type === "Test") {
      created = await Test.create({
        title,
        description,
        subject,
        date: scheduleDate,
        time,
        duration,
        venue,
        maxMarks,
        collegeId: req.user.collegeId,
        createdBy: req.user.id,
      });
    } else {
      return res.status(400).json({ message: "Invalid schedule type" });
    }

    res.status(201).json(toScheduleItem(created, type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:type/:id", auth, checkRole(scheduleManagers), async (req, res) => {
  try {
    const { type, id } = req.params;
    const { title, description, date, time, subject, venue, duration, maxMarks, organizer, category, capacity, status } = req.body;
    const scheduleDate = buildDate(date, time);
    let item;

    if (type === "Event") {
      item = await Event.findOne({ _id: id, collegeId: req.user.collegeId });
      if (!item) return res.status(404).json({ message: "Schedule item not found" });
      if (title !== undefined) item.title = title;
      if (description !== undefined) item.description = description;
      if (venue !== undefined) item.venue = venue;
      if (scheduleDate) item.date = scheduleDate;
      if (time !== undefined) item.time = time;
      if (organizer !== undefined) item.organizer = organizer || "Campus Administration";
      if (category !== undefined) item.category = category || "Other";
      if (capacity !== undefined) item.capacity = capacity;
      if (status !== undefined) item.status = status;
    } else if (type === "Assignment") {
      item = await Assignment.findOne({ _id: id, collegeId: req.user.collegeId });
      if (!item) return res.status(404).json({ message: "Schedule item not found" });
      if (title !== undefined) item.title = title;
      if (description !== undefined) item.description = description;
      if (subject !== undefined) item.subject = subject;
      if (scheduleDate) item.dueDate = scheduleDate;
      if (maxMarks !== undefined) item.maxMarks = maxMarks;
    } else if (type === "Test") {
      item = await Test.findOne({ _id: id, collegeId: req.user.collegeId });
      if (!item) return res.status(404).json({ message: "Schedule item not found" });
      if (title !== undefined) item.title = title;
      if (description !== undefined) item.description = description;
      if (subject !== undefined) item.subject = subject;
      if (scheduleDate) item.date = scheduleDate;
      if (time !== undefined) item.time = time;
      if (duration !== undefined) item.duration = duration;
      if (venue !== undefined) item.venue = venue;
      if (maxMarks !== undefined) item.maxMarks = maxMarks;
    } else {
      return res.status(400).json({ message: "Invalid schedule type" });
    }

    await item.save();
    res.json(toScheduleItem(item, type));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:type/:id", auth, checkRole(scheduleManagers), async (req, res) => {
  try {
    const { type, id } = req.params;
    let result;

    if (type === "Event") {
      result = await Event.deleteOne({ _id: id, collegeId: req.user.collegeId });
    } else if (type === "Assignment") {
      result = await Assignment.deleteOne({ _id: id, collegeId: req.user.collegeId });
    } else if (type === "Test") {
      result = await Test.deleteOne({ _id: id, collegeId: req.user.collegeId });
    } else {
      return res.status(400).json({ message: "Invalid schedule type" });
    }

    if (!result.deletedCount) return res.status(404).json({ message: "Schedule item not found" });
    res.json({ message: "Schedule item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
