const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Resource = require("../models/Resource");
const { auth, checkPermission, checkAnyPermission } = require("../middleware/auth");
const { hasPermission } = require("../utils/roles");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});
const upload = multer({ storage });

// Get all resources for the college
router.get("/", auth, async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { type, subject, semester, branch, section, year, search } = req.query;

    let query = { collegeId };

    if (type) query.type = type;
    if (subject) query.subject = new RegExp(subject, 'i');
    if (semester) query.semester = semester;
    if (branch) query.branch = new RegExp(branch, 'i');
    if (section) query.section = new RegExp(section, 'i');
    if (year) query.year = year;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
        { branch: new RegExp(search, 'i') },
        { section: new RegExp(search, 'i') }
      ];
    }

    const resources = await Resource.find(query).populate("uploadedBy", "name").sort("-createdAt");
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload resource
router.post("/", auth, checkAnyPermission(["manage_resources", "upload_class_resources"]), upload.single("file"), async (req, res) => {
  try {
    const { title, description, type, subject, semester, branch, section, year } = req.body;
    const canManageResources = hasPermission(req.user.roles || [], "manage_resources");

    if (!canManageResources && !["Note", "Writing Material"].includes(type)) {
      return res.status(403).json({ message: "Class reps can upload only notes and writing material" });
    }
    
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const resource = new Resource({
      title,
      description,
      type,
      subject,
      semester,
      branch,
      section,
      year,
      fileUrl,
      uploadedBy: req.user.id,
      collegeId: req.user.collegeId
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update resource (with versioning)
router.put("/:id", auth, checkPermission("manage_resources"), upload.single("file"), async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // Store current in history
    resource.history.push({
      version: resource.version,
      fileUrl: resource.fileUrl,
      updatedAt: new Date()
    });

    resource.version += 1;
    if (req.file) {
      resource.fileUrl = `/uploads/${req.file.filename}`;
    }
    
    const { title, description, type, subject, semester, branch, section, year } = req.body;
    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type !== undefined) resource.type = type;
    if (subject !== undefined) resource.subject = subject;
    if (semester !== undefined) resource.semester = semester;
    if (branch !== undefined) resource.branch = branch;
    if (section !== undefined) resource.section = section;
    if (year !== undefined) resource.year = year;
    
    await resource.save();
    
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete resource
router.delete("/:id", auth, checkAnyPermission(["manage_resources", "upload_class_resources"]), async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    const isOwner = resource.uploadedBy.toString() === req.user.id;
    const canManage = hasPermission(req.user.roles || [], "manage_resources");

    if (!isOwner && !canManage) {
      return res.status(403).json({ message: "You can only delete your own resources" });
    }

    // Delete the physical file if it exists
    if (resource.fileUrl) {
      const filePath = path.join(uploadDir, path.basename(resource.fileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
