const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");
const User = require("../models/User");
const College = require("../models/College");
const { auth, checkRole } = require("../middleware/auth");
const { ROLES, canAssignRole } = require("../utils/roles");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Register (Single) - Protected
router.post("/register", auth, checkRole(["Admin", "Developer", "Sub-admin"]), async (req, res) => {
  try {
    const { name, email, password, roles, collegeId } = req.body;
    const requestedRoles = Array.isArray(roles) && roles.length > 0 ? roles : ["Student"];

    const invalidRole = requestedRoles.find((role) => !ROLES.includes(role));
    if (invalidRole) {
      return res.status(400).json({ message: `Invalid role: ${invalidRole}` });
    }

    const blockedRole = requestedRoles.find((role) => !canAssignRole(req.user.roles || [], role));
    if (blockedRole) {
      return res.status(403).json({ message: `You cannot assign the ${blockedRole} role` });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      collegeId: collegeId || req.user.collegeId,
      roles: requestedRoles
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
        const { name, email, password, roles } = row;
        
        if (!email || !password) {
          results.failed++;
          results.errors.push(`Missing email or password for ${name}`);
          continue;
        }

        let user = await User.findOne({ email });
        if (user) {
          results.failed++;
          results.errors.push(`User ${email} already exists`);
          continue;
        }

        const requestedRoles = roles ? roles.split(",").map(r => r.trim()).filter(Boolean) : ["Student"];
        const invalidRole = requestedRoles.find((role) => !ROLES.includes(role));
        if (invalidRole) {
          results.failed++;
          results.errors.push(`Invalid role ${invalidRole} for ${email}`);
          continue;
        }

        const blockedRole = requestedRoles.find((role) => !canAssignRole(req.user.roles || [], role));
        if (blockedRole) {
          results.failed++;
          results.errors.push(`Cannot assign ${blockedRole} to ${email}`);
          continue;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password.toString(), salt);

        user = new User({
          name,
          email,
          password: hashedPassword,
          collegeId: req.user.collegeId,
          roles: requestedRoles
        });

        await user.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Error creating ${row.email}: ${err.message}`);
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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, roles: user.roles, collegeId: user.collegeId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
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
    if (name) user.name = name;
    await user.save();
    res.json({ message: "Profile updated successfully", user: { id: user._id, name: user.name, email: user.email, roles: user.roles } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

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

module.exports = router;
