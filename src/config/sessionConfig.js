const session = require("express-session")
const mongoStore = require('connect-mongo')


const maxAgeOfCookie = 60 * 1000 * 60

const sessionConfig =session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: true,
  store: mongoStore.create({
    mongoUrl: process.env.DATABASE_URI,
    ttl: maxAgeOfCookie
  }),
  cookie: {
    sameSite: 'strict',
    maxAge: maxAgeOfCookie
  }
})

module.exports = sessionConfig