const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");
const User = require("../models/User");
const College = require("../models/College");
const Event = require("../models/Event");
const Club = require("../models/Club");
const { auth, checkRole } = require("../middleware/auth");
const { ROLES, canAssignRole } = require("../utils/roles");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const adminRoles = ["Admin", "Developer", "Sub-admin"];

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  roles: user.roles,
  collegeId: user.collegeId,
  branch: user.branch,
  section: user.section,
});

const registrationsAreClosed = async (actor) => {
  if (actor.roles?.includes("Developer")) return false;
  const college = actor.collegeId ? await College.findById(actor.collegeId) : null;
  return college?.settings?.allowRegistrations === false;
};

// Register (Single) - Protected
router.post("/register", auth, checkRole(["Admin", "Developer", "Sub-admin"]), async (req, res) => {
  try {
    if (await registrationsAreClosed(req.user)) {
      return res.status(403).json({ message: "New registrations are currently disabled" });
    }

    const { name, email, password, roles, collegeId, branch, section } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const requestedRoles = Array.isArray(roles) && roles.length > 0 ? roles : ["Student"];

    const invalidRole = requestedRoles.find((role) => !ROLES.includes(role));
    if (invalidRole) {
      return res.status(400).json({ message: `Invalid role: ${invalidRole}` });
    }

    const blockedRole = requestedRoles.find((role) => !canAssignRole(req.user.roles || [], role));
    if (blockedRole) {
      return res.status(403).json({ message: `You cannot assign the ${blockedRole} role` });
    }

    if (requestedRoles.includes("Student")) {
      if (!branch || !section) {
        return res.status(400).json({ message: "Branch and Section are mandatory for Students" });
      }
    }

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      collegeId: collegeId || req.user.collegeId,
      roles: requestedRoles,
      ...(branch && { branch }),
      ...(section && { section })
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Register - Protected
router.post("/bulk-register", auth, checkRole(["Admin", "Developer", "Sub-admin"]), upload.single("file"), async (req, res) => {
  try {
    if (await registrationsAreClosed(req.user)) {
      return res.status(403).json({ message: "New registrations are currently disabled" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an excel file" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const row of data) {
      try {
        const { name, email, password, roles, branch, section } = row;
        const normalizedEmail = String(email || "").trim().toLowerCase();
        
        if (!name || !normalizedEmail || !password) {
          results.failed++;
          results.errors.push(`Missing name, email, or password for ${name || normalizedEmail || "row"}`);
          continue;
        }

        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
          results.failed++;
          results.errors.push(`User ${normalizedEmail} already exists`);
          continue;
        }

        const requestedRoles = roles ? roles.split(",").map(r => r.trim()).filter(Boolean) : ["Student"];
        const invalidRole = requestedRoles.find((role) => !ROLES.includes(role));
        if (invalidRole) {
          results.failed++;
          results.errors.push(`Invalid role ${invalidRole} for ${normalizedEmail}`);
          continue;
        }

        const blockedRole = requestedRoles.find((role) => !canAssignRole(req.user.roles || [], role));
        if (blockedRole) {
          results.failed++;
          results.errors.push(`Cannot assign ${blockedRole} to ${normalizedEmail}`);
          continue;
        }

        if (requestedRoles.includes("Student")) {
          if (!branch || !section) {
            results.failed++;
            results.errors.push(`Missing branch or section for Student ${normalizedEmail}`);
            continue;
          }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password.toString(), salt);

        user = new User({
          name,
          email: normalizedEmail,
          password: hashedPassword,
          collegeId: req.user.collegeId,
          roles: requestedRoles,
          ...(branch && { branch }),
          ...(section && { section })
        });

        await user.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Error creating ${row.email || "row"}: ${err.message}`);
      }
    }

    res.json({ message: "Bulk registration completed", results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (Public)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const college = user.collegeId ? await College.findById(user.collegeId) : null;
    const isAdmin = user.roles?.some((role) => adminRoles.includes(role));
    if (college?.settings?.maintenanceMode && !isAdmin) {
      return res.status(403).json({ message: "Campus Hub is currently in maintenance mode" });
    }

    const token = jwt.sign(
      { id: user._id, roles: user.roles, collegeId: user.collegeId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: serializeUser(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    await user.save();
    res.json({ message: "Profile updated successfully", user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get My Activity
router.get("/my-activity", auth, async (req, res) => {
  try {
    const [events, clubs] = await Promise.all([
      Event.find({ registeredStudents: req.user.id, collegeId: req.user.collegeId }).select("title date"),
      Club.find({ "applications.user": req.user.id, "applications.status": "Approved", collegeId: req.user.collegeId }).select("name category")
    ]);

    res.json({ events, clubs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
