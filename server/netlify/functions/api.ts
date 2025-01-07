require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const serverless = require("serverless-http");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const authRoutes = require("../../routes/auth");
const okrRoutes = require("../../routes/okr");
const userManagementRoutes = require("../../routes/userManagement");
const { authenticateWithToken } = require("../../routes/middleware/auth");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { logger } = require("../../utils/log");
const passport = require("passport");
require("../../config/passport"); // Ensure passport configuration is loaded

console.log(authRoutes);

console.log("Type of imported logger in api.js:", typeof logger);
const log = logger("server");

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  log.error("Error: DATABASE_URL or SESSION_SECRET variables in .env missing.");
  process.exit(-1);
}

const app = express();
app.enable("json spaces");
app.enable("strict routing");

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../../../client/build")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

app.use(passport.initialize());
app.use(passport.session());

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

app.use("/uploads", (req, res, next) => {
  log.info(`Static file requested: ${req.url}`);
  next();
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage
const isProduction = process.env.NODE_ENV == "production";
console.log("isProduction:", isProduction);
const storage = isProduction
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "profile-pictures",
        allowed_formats: ["jpg", "png", "jpeg"],
      },
    })
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "uploads/");
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
      },
    });

const upload = multer({ storage: storage });

// Update the file upload endpoint
app.post("/upload", upload.single("profilePicture"), (req, res) => {
  log.info("Received file upload request");
  if (req.file) {
    const fileUrl =
      process.env.NODE_ENV === "production"
        ? req.file.path // Cloudinary URL
        : `${req.protocol}://${req.get("host")}/${req.file.path}`; // Local URL
    log.info(`File uploaded successfully: ${fileUrl}`);
    res.json({ success: true, fileUrl: fileUrl });
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

// Serve the frontend application for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../../client/build/index.html"));
});

app.use((err, req, res, next) => {
  log.error(`Unhandled application error: ${err.message}`);
  log.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

// Export the handler for Netlify
module.exports.handler = serverless(app);
