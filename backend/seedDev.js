require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const College = require("./models/College");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected");

    // Find or create a college
    let college = await College.findOne();
    if (!college) {
      college = await College.create({ name: "Test University", domain: "testuni.edu" });
      console.log("Created college:", college.name);
    }

    // Check if dev account already exists
    const existing = await User.findOne({ email: "dev@testuni.edu" });
    if (existing) {
      console.log("Dev account already exists!");
      console.log("  Email: dev@testuni.edu");
      console.log("  Password: dev123456");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("dev123456", salt);

    const devUser = await User.create({
      name: "Test Developer",
      email: "dev@testuni.edu",
      password: hashedPassword,
      roles: ["Developer"],
      collegeId: college._id,
    });

    console.log("\n✅ Test Developer account created!");
    console.log("================================");
    console.log("  Email:    dev@testuni.edu");
    console.log("  Password: dev123456");
    console.log("  Roles:    Developer");
    console.log("================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

seed();
