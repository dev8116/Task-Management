require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const seedAdmin = require("./utils/seedAdmin");
const { startAttendanceScheduler } = require("./utils/attendanceScheduler"); // ✅ require first
const { initSocket } = require("./utils/socket");

// Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const aiRoutes = require("./routes/aiRoutes");
//const geofenceRoutes = require("./routes/geofenceRoutes");
//const holidayRoutes = require("./routes/holidayRoutes");
const goalRoutes = require("./routes/goalRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Connect DB then seed configured admin (if enabled) + start scheduler
connectDB().then(() => {
  seedAdmin();
  startAttendanceScheduler(); // ✅ start after DB is connected
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
//app.use("/api/geofences", geofenceRoutes);
//app.use("/api/holidays", holidayRoutes);
app.use("/api/goals", goalRoutes);

// Static for uploads
app.use("/uploads", express.static("uploads"));

// Health check
app.get("/", (req, res) => res.json({ message: "FlowTrack API is running" }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => console.log(`FlowTrack server running on port ${PORT}`));