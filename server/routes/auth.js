const express = require("express");
const UserService = require("../services/user.js");
const { requireUser } = require("./middleware/auth.js");
const logger = require("../utils/log.js");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const {
  validatePassword,
  generatePasswordHash,
} = require("../utils/password.js");
const router = express.Router();
const log = logger("api/routes/authRoutes");

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

router.post("/login", async (req, res) => {
  const sendError = (msg) => res.status(400).json({ error: msg });
  const { email, password } = req.body;

  console.log("Login attempt for email:", email);

  if (!email || !password) {
    console.log("Login failed: Email or password missing");
    return sendError("Email and password are required");
  }

  try {
    console.log("Attempting to authenticate user");
    const user = await UserService.authenticateWithPassword(email, password);

    if (user) {
      log.info(`User logged in successfully: ${user.email}`);
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      console.log("User data being sent to client:", user.toJSON());
      return res.json({ token, user: user.toJSON() });
    } else {
      console.log("Authentication failed for email:", email);
      log.warn(`Failed login attempt for email: ${email}`);
      return sendError("Email or password is incorrect");
    }
  } catch (error) {
    console.error("Detailed error during login:", error);
    log.error("Error during login:", error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.post("/register", upload.single("profilePicture"), async (req, res) => {
  log.info("Received registration request");
  try {
    const { name, email, password, role, designation, department } = req.body;

    if (!name || !email || !password || !role || !designation || !department) {
      log.warn("Registration attempt with missing fields");
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!["Admin", "Manager", "Employee"].includes(role)) {
      log.warn(`Invalid role attempted: ${role}`);
      return res.status(400).json({ error: "Invalid role selected" });
    }

    const validDepartments = [
      "QA",
      "Frontend",
      "Backend",
      "PM",
      "HR",
      "Marketing",
      "Design",
      "DevOps",
      "Operations",
      "Network",
    ];
    if (!validDepartments.includes(department)) {
      log.warn(`Invalid department attempted: ${department}`);
      return res.status(400).json({ error: "Invalid department selected" });
    }

    const profilePicture = req.file ? req.file.path : undefined;
    const userExists = await UserService.getByEmail(req.body.email);
    if (userExists) {
      log.warn(`Email is already registered: ${email}`);
      return res.status(405).json({ error: "Email is already registered" });
    }
    const user = await UserService.createUser({
      name,
      email,
      password,
      role,
      designation,
      department,
      profilePicture,
    });
    log.info(`User registered successfully: ${user.email}`);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log(
      "User data being sent to client after registration:",
      user.toJSON()
    );
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    log.error("Error during registration:", error);
    return res
      .status(500)
      .json({ error: "An unexpected error occurred during registration" });
  }
});

router.post("/logout", requireUser, async (req, res) => {
  try {
    await UserService.regenerateToken(req.user);
    log.info(`User logged out: ${req.user.email}`);
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          log.error("Error during session destruction:", err);
        }
      });
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    log.error("Error during logout:", error);
    res.status(500).json({ success: false, message: "Error logging out" });
  }
});

router.all("/api/auth/logout", requireUser, async (req, res) => {
  try {
    await UserService.regenerateToken(req.user);
    log.info(`User logged out: ${req.user.email}`);
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          log.error("Error during session destruction:", err);
        }
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    log.error("Error during logout:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error logging out" });
  }
});

router.get("/me", requireUser, async (req, res) => {
  log.info(`User profile requested: ${req.user.email}`);
  console.log("User data being sent to client for profile:", req.user.toJSON());
  return res.status(200).json(req.user.toJSON());
});

router.put("/update-profile", requireUser, async (req, res) => {
  try {
    log.info(`Received profile update request for user: ${req.user.email}`);
    const { name, email, department, designation, role } = req.body;
    const userId = req.user._id;

    log.info(`Updating profile for user ID: ${userId}`);
    const updatedUser = await UserService.update(userId, {
      name,
      email,
      department,
      designation,
      role,
    });

    if (!updatedUser) {
      log.warn(`User not found for profile update: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    log.info(`User profile updated successfully: ${updatedUser.email}`);
    console.log("Updated user data:", updatedUser.toJSON());
    return res.json({ success: true, user: updatedUser.toJSON() });
  } catch (error) {
    log.error("Error updating user profile:", error);
    console.error("Detailed error during profile update:", error);
    return res
      .status(500)
      .json({
        error: "An unexpected error occurred while updating the profile",
      });
  }
});

router.post(
  "/update-profile-picture",
  requireUser,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      log.info(
        `Received profile picture update request for user: ${req.user.email}`
      );

      if (!req.file) {
        log.warn("No file uploaded for profile picture update");
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user._id;
      const profilePicture = req.file.path;

      log.info(`Updating profile picture for user ID: ${userId}`);
      const updatedUser = await UserService.update(userId, { profilePicture });

      if (!updatedUser) {
        log.warn(`User not found for profile picture update: ${userId}`);
        return res.status(404).json({ error: "User not found" });
      }

      log.info(
        `User profile picture updated successfully: ${updatedUser.email}`
      );
      console.log("Updated user data:", updatedUser.toJSON());
      return res.json({
        success: true,
        message: "Profile picture updated successfully",
        profilePicture: updatedUser.profilePicture,
      });
    } catch (error) {
      log.error("Error updating user profile picture:", error);
      console.error("Detailed error during profile picture update:", error);
      return res
        .status(500)
        .json({
          error:
            "An unexpected error occurred while updating the profile picture",
        });
    }
  }
);

router.put("/change-password", requireUser, async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email, old password, and new password are required" });
  }
  try {
    const user = await UserService.getByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isPasswordValid = await validatePassword(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }
    user.password = await generatePasswordHash(newPassword);
    await user.save();
    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

module.exports = router;
