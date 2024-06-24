const passport = require('passport');
const { oauthGoogleCreateOrCheckUser } = require('../helpers/oauthHelper');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/callback",
  passReqToCallback: true
},
  async function (req, accessToken, refreshToken, profile, done) {
    const user = await oauthGoogleCreateOrCheckUser(profile)
    // return done(null, profile)
    return done(null, user)
  }
));


passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

module.exports = passport