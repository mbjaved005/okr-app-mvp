require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const { authenticateWithToken } = require('./routes/middleware/auth');
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const logger = require('./utils/log');
const userManagementRoutes = require('./routes/userManagement');
const okrRoutes = require('./routes/okr'); // Import OKR routes

const log = logger('server');

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  log.error("Error: DATABASE_URL or SESSION_SECRET variables in .env missing.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;
app.enable('json spaces');
app.enable('strict routing');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use((req, res, next) => {
  log.info(`Received ${req.method} request to ${req.url}`);
  next();
});

app.use(authenticateWithToken);
app.use('/api/auth', (req, res, next) => {
  log.info(`Received request to /api/auth: ${req.method} ${req.url}`);
  next();
}, authRoutes);

mongoose
  .connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    log.info("Connected to MongoDB");
  })
  .catch((err) => {
    log.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  }),
);

app.on("error", (error) => {
  log.error(`Server error: ${error.message}`);
  log.error(error.stack);
});

app.use((req, res, next) => {
  const sess = req.session;
  res.locals.session = sess;
  if (!sess.views) {
    sess.views = 1;
    log.info("Session created at: ", new Date().toISOString());
  } else {
    sess.views++;
    log.info(
      `Session accessed again at: ${new Date().toISOString()}, Views: ${sess.views}, User ID: ${sess.userId || '(unauthenticated)'}`,
    );
  }
  next();
});

app.use(basicRoutes);

app.post('/api/upload', upload.single('profilePicture'), (req, res) => {
  log.info('Received file upload request');
  if (req.file) {
    log.info(`File uploaded successfully: ${req.file.path}`);
    res.json({ success: true, filePath: req.file.path });
  } else {
    log.warn('No file uploaded');
    res.status(400).json({ success: false, message: 'No file uploaded' });
  }
});

app.use('/uploads', express.static('uploads'));
log.info('Static file serving configured for /uploads directory');

app.use('/uploads', (req, res, next) => {
  log.info(`Static file requested: ${req.url}`);
  next();
});

app.use('/api/users', userManagementRoutes);
app.use('/api/okrs', okrRoutes); // Integrate OKR routes

app.use((req, res, next) => {
  log.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send("Page not found.");
});

app.use((err, req, res, next) => {
  log.error(`Unhandled application error: ${err.message}`);
  log.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  log.info(`Server is running on port ${port}`);
}).on('error', (err) => {
  log.error('Failed to start server', err);
});