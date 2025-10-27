const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, googleProfile, done) => {
      try {
        let existingUser = await User.findOne({ email: googleProfile.emails[0].value });

        
        if (!existingUser) {
          existingUser = new User({
            name: googleProfile.displayName,
            email: googleProfile.emails[0].value,
            profilePic: {
              url: googleProfile.photos[0].value,
              public_id: "google-oauth",
            },
            role: "user",
          });

          await existingUser.save();
        }

        const authToken = jwt.sign(
          { id: existingUser._id },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        return done(null, { user: existingUser, token: authToken });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;

