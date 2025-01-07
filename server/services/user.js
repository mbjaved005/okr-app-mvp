const { randomUUID } = require("crypto");
const User = require("../models/user.js");
const OKR = require("../models/okr.js");
const { generatePasswordHash, validatePassword } = require("../utils/password");
const { logger } = require("../utils/log.js");
const jwt = require("jsonwebtoken");

const log = logger("service/userService");

class UserService {
  static async list() {
    try {
      return User.find();
    } catch (err) {
      log.error(`Database error while listing users: ${err}`);
      throw `Database error while listing users: ${err}`;
    }
  }

  static async get(id) {
    try {
      return User.findOne({ _id: id }).exec();
    } catch (err) {
      log.error(`Database error while getting the user by their ID: ${err}`);
      throw `Database error while getting the user by their ID: ${err}`;
    }
  }

  static async getByEmail(email) {
    try {
      return User.findOne({ email }).exec();
    } catch (err) {
      log.error(`Database error while getting the user by their email: ${err}`);
      throw `Database error while getting the user by their email: ${err}`;
    }
  }

  static async update(id, data) {
    try {
      return User.findOneAndUpdate({ _id: id }, data, {
        new: true,
        upsert: false,
      });
    } catch (err) {
      log.error(`Database error while updating user ${id}: ${err}`);
      throw `Database error while updating user ${id}: ${err}`;
    }
  }

  static async delete(id) {
    try {
      const result = await User.deleteOne({ _id: id }).exec();
      return result.deletedCount === 1;
    } catch (err) {
      log.error(`Database error while deleting user ${id}: ${err}`);
      throw `Database error while deleting user ${id}: ${err}`;
    }
  }

  static async deleteUserAndHandleOKRs(userId) {
    log.info(`Starting deletion process for user: ${userId}`);
    try {
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        log.warn(`User not found for deletion with ID: ${userId}`);
        return false;
      }

      // Delete "Individual" OKRs created by the user
      log.info(
        `Attempting to delete Individual OKRs created by user: ${userId}`
      );
      const deletedOKRs = await OKR.deleteMany({
        createdBy: userId,
        category: "Individual",
      });
      log.info(
        `Deleted ${deletedOKRs.deletedCount} Individual OKRs for user: ${userId}`
      );

      // Update "Team" OKRs to remove the user from owners
      log.info(
        `Attempting to update Team OKRs to remove user: ${user.name} from owners`
      );
      const updatedOKRs = await OKR.updateMany(
        { owners: user.name, category: "Team" },
        { $pull: { owners: user.name } }
      );
      log.info(
        `Updated ${updatedOKRs.modifiedCount} Team OKRs to remove user: ${user.name}`
      );

      // Delete the user
      await User.findByIdAndDelete(userId);

      log.info(`Completed deletion process for user: ${userId}`);
      return true;
    } catch (err) {
      log.error(
        `Error while deleting user and handling OKRs: ${err.message}`,
        err
      );
      throw new Error(
        `Error while deleting user and handling OKRs: ${err.message}`
      );
    }
  }

  static async authenticateWithPassword(email, password) {
    if (!email) throw "Email is required";
    if (!password) throw "Password is required";

    try {
      const user = await User.findOne({ email }).exec();
      if (!user) return null;
      const passwordValid = await validatePassword(password, user.password);
      if (!passwordValid) return null;

      user.lastLoginAt = Date.now();
      const updatedUser = await user.save();
      return updatedUser;
    } catch (err) {
      log.error(
        `Database error while authenticating user ${email} with password: ${err}`
      );
      throw `Database error while authenticating user ${email} with password: ${err}`;
    }
  }

  static async authenticateWithToken(token) {
    try {
      return User.findOne({ token }).exec();
    } catch (err) {
      log.error(`Database error while authenticating user with token: ${err}`);
      throw `Database error while authenticating user with token: ${err}`;
    }
  }

  static async regenerateToken(user) {
    user.token = randomUUID(); // eslint-disable-line

    try {
      if (!user.isNew) {
        await user.save();
      }

      return user;
    } catch (err) {
      log.error(`Database error while generating user token: ${err}`);
      throw `Database error while generating user token: ${err}`;
    }
  }

  static async createUser({
    email,
    password,
    name,
    role,
    designation,
    department,
    profilePicture,
  }) {
    if (!email) throw "Email is required";
    if (!password) throw "Password is required";
    if (!name) throw "Name is required";
    if (!role) throw "Role is required";
    if (!designation) throw "Designation is required";
    if (!department) throw "Department is required";

    const existingUser = await UserService.getByEmail(email);
    if (existingUser) throw "User with this email already exists";

    try {
      const user = new User({
        email,
        password,
        name,
        role,
        designation,
        department,
        profilePicture,
        token: randomUUID(),
        isVerified: false,
      });

      await user.save();
      return user;
    } catch (err) {
      log.error(`Database error while creating new user: ${err}`);
      throw `Database error while creating new user: ${err}`;
    }
  }

  static async setPassword(user, password) {
    if (!password) throw "Password is required";
    user.password = await generatePasswordHash(password); // eslint-disable-line

    try {
      if (!user.isNew) {
        await user.save();
      }
      return user;
    } catch (err) {
      log.error(`Database error while setting user password: ${err}`);
      throw `Database error while setting user password: ${err}`;
    }
  }

  static async findOrCreateGoogleUser(googleId, email, name, profilePicture) {
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        profilePicture,
        password: randomUUID(), // Generate a random password for Google users
        role: "Employee", // Default role, can be changed later
        designation: "Not specified", // Default designation
        department: "Not specified", // Default department
      });
      await user.save();
    }
    return user;
  }

  static generateEmailVerificationToken(user) {
    const payload = { userId: user._id, email: user.email };
    const secret = process.env.JWT_SECRET;
    const options = { expiresIn: "1h" };
    return jwt.sign(payload, secret, options);
  }

  static verifyEmailVerificationToken(token) {
    const secret = process.env.JWT_SECRET;
    try {
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (err) {
      log.error(`Error while verifying email verification token: ${err}`);
      throw `Error while verifying email verification token: ${err}`;
    }
  }

  static async verifyEmailToken(token) {
    try {
      const decoded = UserService.verifyEmailVerificationToken(token);
      const user = await User.findById(decoded.userId);
      if (!user) throw "User not found";
      user.isVerified = true;
      await user.save();
      return user;
    } catch (err) {
      log.error(`Error while verifying email token: ${err}`);
      throw `Error while verifying email token: ${err}`;
    }
  }
}

module.exports = UserService;
