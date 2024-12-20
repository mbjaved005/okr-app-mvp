require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const serverless = require("serverless-http");
const session = require("express-session");
const MongoStore = require("connect-mongo");
import authRoutes from "../../routes/auth";
import okrRoutes from "../../routes/okr";
import userManagementRoutes from "../../routes/userManagement";
import { authenticateWithToken } from "../../routes/middleware/auth";
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const logger = require("../../utils/log");
const netlifyUpload = require('netlify-lambda-upload');

const log = logger("server");

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  log.error("Error: DATABASE_URL or SESSION_SECRET variables in .env missing.");
  process.exit(-1);
}

const app = express();
app.enable("json spaces");
app.enable("strict routing");

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const uploadMiddleware = process.env.USE_NETLIFY_LARGE_MEDIA === 'true' ? netlifyUpload.single('profilePicture') : upload.single('profilePicture');

// Middleware for logging requests
app.use((req, res, next) => {
  log.info(`Received ${req.method} request to ${req.url}`);
  next();
});

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    log.info("Connected to MongoDB");
  })
  .catch((err) => {
    log.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  })
);

// Handle server errors
app.on("error", (error) => {
  log.error(`Server error: ${error.message}`);
  log.error(error.stack);
});

// Middleware for session handling
app.use((req, res, next) => {
  const sess = req.session;
  res.locals.session = sess;
  if (!sess.views) {
    sess.views = 1;
    log.info("Session created at: ", new Date().toISOString());
  } else {
    sess.views++;
    log.info(
      `Session accessed again at: ${new Date().toISOString()}, Views: ${
        sess.views
      }, User ID: ${sess.userId || "(unauthenticated)"}`
    );
  }
  next();
});

// Define routes
app.use(authenticateWithToken);
app.use("/api/auth", authRoutes);
app.use("/api/users", userManagementRoutes);
app.use("/api/okrs", okrRoutes);

// Auth routes
app.use(
  "/api/auth",
  (req, res, next) => {
    log.info(`Received request to /api/auth: ${req.method} ${req.url}`);
    next();
  },
  authRoutes
);

app.get("/api/auth/test", (req, res) => {
  res.json({ message: "Auth route is working" });
});

app.use("/uploads", (req, res, next) => {
  log.info(`Static file requested: ${req.url}`);
  next();
});

// File upload endpoint
app.post("/upload", uploadMiddleware, (req, res) => {
  log.info("Received file upload request");
  if (req.file) {
    log.info(`File uploaded successfully: ${req.file.path}`);
    res.json({ success: true, filePath: req.file.path });
  } else {
    log.warn("No file uploaded");
    res.status(400).json({ success: false, message: "No file uploaded" });
  }
});

// Serve static files
app.use("/uploads", express.static("uploads"));
log.info("Static file serving configured for /uploads directory");

// Handle errors and not found routes for API
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    log.warn(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).send("Page not found.");
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  log.error(`Unhandled application error: ${err.message}`);
  log.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

// Export the handler for Netlify
module.exports.handler = serverless(app);
