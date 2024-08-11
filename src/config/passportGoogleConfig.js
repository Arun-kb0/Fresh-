const passport = require('passport');
const { oauthGoogleCreateOrCheckUser } = require('../helpers/oauthHelper');
const userModel = require('../model/userModel');
const GoogleStrategy = require('passport-google-oauth2').Strategy;



passport.serializeUser((user, done) => {
  done(null, user.userId)
})

passport.deserializeUser(async (userId, done) => {
  try {
    if (userId) {
      const sessionUser = await userModel.findOne({ userId: userId, isBlocked: false })
      // console.log("deserializeUser run ")
      done(null, sessionUser)
    } else {
      done(new Error("user id missing"), null)
    }
  } catch (error) {
    done(error, null)
  }
})


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.PASSPORT_GOOGLE_CALLBACK_URL,
  passReqToCallback: true
},
  async function (req, accessToken, refreshToken, profile, done) {
    try {
      const user = await oauthGoogleCreateOrCheckUser(profile)
      return done(null, user)
    } catch (error) {
      return done(error, null)
    }
  }
));



module.exports = passport