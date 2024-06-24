const passport = require("passport");
const { oauthFacebookCreateOrCheckUser } = require("../helpers/oauthHelper");
const FacebookStrategy = require('passport-facebook').Strategy;


passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos', 'email']
},
  async function (accessToken, refreshToken, profile, cb) {
    const user = await oauthFacebookCreateOrCheckUser(profile)
    return cb(null, user)
  }
));