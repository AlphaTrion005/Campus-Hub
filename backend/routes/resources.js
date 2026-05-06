const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Resource = require("../models/Resource");
const AuditLog = require("../models/AuditLog");
const { auth, checkAnyPermission } = require("../middleware/auth");
const { hasPermission } = require("../utils/roles");
const { createSearchRegex } = require("../utils/search");

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

const removeUploadedFile = (file) => {
  if (!file?.path) return;
  try {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  } catch {
    // Ignore cleanup failures; the API response should reflect the validation error.
  }
};

// Get all resources for the college
router.get("/", auth, async (req, res) => {
  try {
    const { collegeId } = req.user;
    const { type, subject, semester, branch, section, year, search } = req.query;

    let query = { collegeId };

    if (type) query.type = type;
    if (subject) query.subject = createSearchRegex(subject);
    if (semester) query.semester = semester;
    if (branch) query.branch = createSearchRegex(branch);
    if (section) query.section = createSearchRegex(section);
    if (year) query.year = year;
    if (search) {
      const searchRegex = createSearchRegex(search);
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { subject: searchRegex },
        { branch: searchRegex },
        { section: searchRegex }
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

    if (!title || !type) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: "Title and type are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      removeUploadedFile(req.file);
      return res.status(404).json({ message: "User not found" });
    }

    const userRoles = user.roles || [];
    const isAdministrative = userRoles.some(r => ["Developer", "Admin", "Sub-admin"].includes(r));

    if (!isAdministrative) {
      const isTeacher = userRoles.includes("Teacher");
      const isClassRep = userRoles.includes("Class Rep");

      if (isTeacher || isClassRep) {
        if (!branch || !section) {
          removeUploadedFile(req.file);
          return res.status(400).json({ message: "Branch and section are required" });
        }
        if (!user.branch.includes(branch) || !user.section.includes(section)) {
          removeUploadedFile(req.file);
          return res.status(403).json({ message: `You are not assigned to class ${branch}-${section}` });
        }
      }
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

    await AuditLog.create({
      action: "RESOURCE_CREATE",
      category: "Resource",
      performedBy: req.user.id,
      details: `Uploaded resource: ${title} (${type})`,
      collegeId: req.user.collegeId
    });

    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update resource (with versioning)
router.put("/:id", auth, checkAnyPermission(["manage_resources", "upload_class_resources"]), upload.single("file"), async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!resource) {
      removeUploadedFile(req.file);
      return res.status(404).json({ message: "Resource not found" });
    }

    const { title, description, type, subject, semester, branch, section, year } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      removeUploadedFile(req.file);
      return res.status(404).json({ message: "User not found" });
    }

    const userRoles = user.roles || [];
    const isAdministrative = userRoles.some(r => ["Developer", "Admin", "Sub-admin"].includes(r));

    if (!isAdministrative) {
      const isTeacher = userRoles.includes("Teacher");
      const isClassRep = userRoles.includes("Class Rep");

      if (isTeacher || isClassRep) {
        const targetBranch = branch || resource.branch;
        const targetSection = section || resource.section;
        if (!user.branch.includes(targetBranch) || !user.section.includes(targetSection)) {
          removeUploadedFile(req.file);
          return res.status(403).json({ message: `You are not assigned to class ${targetBranch}-${targetSection}` });
        }
      }
    }

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

    if (title !== undefined) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type !== undefined) resource.type = type;
    if (subject !== undefined) resource.subject = subject;
    if (semester !== undefined) resource.semester = semester;
    if (branch !== undefined) resource.branch = branch;
    if (section !== undefined) resource.section = section;
    if (year !== undefined) resource.year = year;

    await resource.save();

    await AuditLog.create({
      action: "RESOURCE_UPDATE",
      category: "Resource",
      performedBy: req.user.id,
      details: `Updated resource: ${resource.title} (v${resource.version})`,
      collegeId: req.user.collegeId
    });

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

    const userRoles = req.user.roles || [];
    const canManage = hasPermission(userRoles, "manage_resources");
    const isClassRep = userRoles.includes("Class Rep");

    // Restriction: Class Reps cannot delete resources (even their own) to prevent accidental removal
    if (isClassRep && !canManage) {
      return res.status(403).json({ message: "Class Representatives are not allowed to delete resources" });
    }

    const isOwner = resource.uploadedBy.toString() === req.user.id;

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

    await AuditLog.create({
      action: "RESOURCE_DELETE",
      category: "Resource",
      performedBy: req.user.id,
      details: `Deleted resource: ${resource.title}`,
      collegeId: req.user.collegeId
    });

    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
