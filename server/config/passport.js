const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user"); // Adjust the path as needed
const { logger } = require("../utils/log"); // Import the logger

const log = logger("config/passport"); // Define the log variable

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await UserService.findOrCreateGoogleUser(
          profile.id,
          profile.emails[0].value,
          profile.displayName,
          profile.photos[0].value
        );
        return done(null, user);
      } catch (err) {
        log.error("Error during Google OAuth authentication:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
