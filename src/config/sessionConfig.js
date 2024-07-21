const session = require("express-session")
const mongoStore = require('connect-mongo')


const sessionCookieMaxAge = 1000 * 60 * 60 * 60

const sessionConfig = session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: true,
  store: mongoStore.create({
    mongoUrl: process.env.DATABASE_URI,
    ttl: sessionCookieMaxAge
  }),
  cookie: {
    sameSite: 'strict',
    maxAge: sessionCookieMaxAge
  }
})


module.exports = {
  sessionConfig,
  sessionCookieMaxAge
}