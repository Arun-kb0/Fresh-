require('dotenv').config()
const session = require("express-session")

const sessionConfig =session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: true,
  cookie: {
    sameSite: 'strict',
    maxAge: 60 * 1000 * 60
  }
})

module.exports = sessionConfig