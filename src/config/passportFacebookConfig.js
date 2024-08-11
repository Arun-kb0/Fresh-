const passport = require("passport");
const { oauthFacebookCreateOrCheckUser } = require("../helpers/oauthHelper");
const FacebookStrategy = require('passport-facebook').Strategy;



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
    done(err, null)
  }
})


passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.PASSPORT_FACEBOOK_CALLBACK_URL,
  profileFields: ['id', 'displayName', 'photos', 'email']
},
  async function (accessToken, refreshToken, profile, cb) {
    try {
      const user = await oauthFacebookCreateOrCheckUser(profile)
      return cb(null, user)
    } catch (error) {
      return cb(error, null)
    }
  }
));