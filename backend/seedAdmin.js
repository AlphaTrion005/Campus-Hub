const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const College = require("./models/College");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const college = await College.findOne({ domain: "mycollege.edu" });
    if (!college) {
      console.log("College not found. Create it first using /create-college route.");
      process.exit(1);
    }

    const email = "admin@mycollege.edu";
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const admin = new User({
      name: "System Admin",
      email: email,
      password: hashedPassword,
      collegeId: college._id,
      roles: ["Admin", "Developer"]
    });

    await admin.save();
    console.log("Admin user created: admin@mycollege.edu / admin123");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();
