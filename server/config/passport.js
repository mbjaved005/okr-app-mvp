const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserService = require("../services/user.js");
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
        if (!user.isVerified) {
          user.isVerified = true;
          await user.save();
        }
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
    const user = await UserService.get(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
