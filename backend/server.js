require("dotenv").config();

const dns = require("dns");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const College = require("./models/College");
const { auth, checkPermission } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const authRoutes = require("./routes/auth");
const scheduleRoutes = require("./routes/schedule");
const resourceRoutes = require("./routes/resources");
const eventRoutes = require("./routes/events");
const clubRoutes = require("./routes/clubs");
const lostFoundRoutes = require("./routes/lostFound");
const reportRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const dashboardRoutes = require("./routes/dashboard");
const studentRoutes = require("./routes/students");

app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/students", studentRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Server running");
});

// Create college route
app.get("/create-college", auth, checkPermission("manage_settings"), async (req, res) => {
  try {
    const college = await College.create({
      name: "My College",
      domain: "mycollege.edu",
    });

    res.json(college);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("MONGO_URI is missing. Add it to backend/.env.");
  process.exit(1);
}

if (mongoUri.includes("xxxxx")) {
  console.error("MONGO_URI still contains Atlas placeholder text. Copy the real connection string from Atlas > Connect > Drivers.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to backend/.env.");
  process.exit(1);
}

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Connect DB and start server
mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("DB connected");

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch(err => {
    if (err.code === "ECONNREFUSED" && err.syscall === "querySrv") {
      console.error("MongoDB Atlas DNS lookup was refused. Try a mobile hotspot or set your network DNS to 8.8.8.8 / 1.1.1.1.");
    }

    if (err.message && err.message.includes("bad auth")) {
      console.error("MongoDB Atlas rejected the username or password. Reset the database user's password in Atlas > Database Access, then update backend/.env.");
    }

    console.error(err);
    process.exit(1);
  });
