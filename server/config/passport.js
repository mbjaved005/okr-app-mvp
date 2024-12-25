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
    async (token, tokenSecret, profile, done) => {
      try {
        log.info(`Google OAuth profile received: ${profile.id}`);
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          log.info(`Creating new user for Google ID: ${profile.id}`);
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
          });
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
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
