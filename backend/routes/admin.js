const express = require("express");
const User = require("../models/User");
const College = require("../models/College");
const AuditLog = require("../models/AuditLog");
const { auth, checkPermission, checkAnyPermission } = require("../middleware/auth");
const { ROLES, canAssignRole } = require("../utils/roles");

const router = express.Router();

const canManageTargetUser = (actorRoles = [], targetRoles = []) => {
  if (actorRoles.includes("Developer")) return true;
  if (actorRoles.includes("Admin")) return !targetRoles.includes("Developer");
  if (actorRoles.includes("Sub-admin")) {
    return !targetRoles.some((role) => ["Developer", "Admin"].includes(role));
  }
  return false;
};

// Get all users (Admin/Dev only)
// Get all users
router.get("/users", auth, checkAnyPermission(["manage_users", "manage_non_admin_users"]), async (req, res) => {
  try {
    const users = await User.find({ collegeId: req.user.collegeId }).select("-password").sort("-createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user roles
// Update user roles
router.put("/users/:id/role", auth, checkAnyPermission(["manage_users", "manage_non_admin_users"]), async (req, res) => {
  try {
    const { roles } = req.body;
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: "At least one valid role is required" });
    }

    const invalidRole = roles.find((role) => !ROLES.includes(role));
    if (invalidRole) {
      return res.status(400).json({ message: `Invalid role: ${invalidRole}` });
    }

    const blockedRole = roles.find((role) => !canAssignRole(req.user.roles || [], role));
    if (blockedRole) {
      return res.status(403).json({ message: `You cannot assign the ${blockedRole} role` });
    }

    const user = await User.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!canManageTargetUser(req.user.roles || [], user.roles || [])) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Prevent removing own Admin/Dev role if last one (basic safety)
    if (user._id.toString() === req.user.id && !roles.includes("Admin") && !roles.includes("Developer")) {
        return res.status(400).json({ message: "Cannot remove your own administrative rights" });
    }

    user.roles = roles;
    await user.save();

    await AuditLog.create({
      action: "USER_ROLE_UPDATE",
      performedBy: req.user.id,
      targetUser: user._id,
      details: `Roles updated to: ${roles.join(", ")}`,
      collegeId: req.user.collegeId
    });

    res.json({ message: "Roles updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user info (name, email)
router.put("/users/:id", auth, checkAnyPermission(["manage_users", "manage_non_admin_users"]), async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!canManageTargetUser(req.user.roles || [], user.roles || [])) {
      return res.status(403).json({ message: "Permission denied" });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    await AuditLog.create({
      action: "USER_UPDATE",
      performedBy: req.user.id,
      targetUser: user._id,
      details: `Updated info: ${name || user.name}, ${email || user.email}`,
      collegeId: req.user.collegeId
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
// Delete user
router.delete("/users/:id", auth, checkAnyPermission(["manage_users", "manage_non_admin_users"]), async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account from here" });
    }

    if (!canManageTargetUser(req.user.roles || [], user.roles || [])) {
      return res.status(403).json({ message: "Permission denied" });
    }

    await User.deleteOne({ _id: req.params.id, collegeId: req.user.collegeId });

    await AuditLog.create({
      action: "USER_DELETE",
      performedBy: req.user.id,
      details: `Deleted user: ${user.email} (${user.name})`,
      collegeId: req.user.collegeId
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Audit Logs
// Get Audit Logs
router.get("/logs", auth, checkPermission("view_audit_logs"), async (req, res) => {
  try {
    const logs = await AuditLog.find({ collegeId: req.user.collegeId })
      .populate("performedBy", "name email")
      .populate("targetUser", "name email")
      .sort("-createdAt")
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get College Settings
// Get College Settings
router.get("/settings", auth, checkPermission("manage_settings"), async (req, res) => {
  try {
    const college = await College.findById(req.user.collegeId);
    res.json(college);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update College Settings
// Update College Settings
router.put("/settings", auth, checkPermission("manage_settings"), async (req, res) => {
  try {
    const { name, domain } = req.body;
    const college = await College.findById(req.user.collegeId);
    
    if (name) college.name = name;
    if (domain) college.domain = domain;
    
    await college.save();

    await AuditLog.create({
      action: "COLLEGE_SETTINGS_UPDATE",
      performedBy: req.user.id,
      details: `Updated settings: ${name || 'N/A'}, ${domain || 'N/A'}`,
      collegeId: req.user.collegeId
    });

    res.json(college);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
