const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const expressEjsLayouts = require("express-ejs-layouts")
const cookieParser = require("cookie-parser")
const path = require('path')
const passport = require('passport')
const flash = require('connect-flash')

const connectDB = require('./src/config/dbConnection')
const {sessionConfig} = require('./src/config/sessionConfig')
const authRouter = require('./src/routes/auth/authRoutes')
const adminRouter = require('./src/routes/admin/adminRoutes')
const errorHandler = require('./src/middleware/errorHandler')
const { auth } = require('./src/middleware/authMiddleware')
const productRouter = require('./src/routes/user/productRoutes')
const { userCheck, adminCheck } = require('./src/middleware/adminAndUserCheckMiddleware')
const { logger } = require('./src/middleware/loggerMiddleware')
require('./src/config/passportGoogleConfig')
require('./src/config/passportFacebookConfig')
const profileRouter  = require('./src/routes/user/profileRoutes')
const cartRouter = require('./src/routes/user/cartRoutes')

const PORT = process.env.PORT || 3000
const app = express()
connectDB()


// * view engine setup
app.use(expressEjsLayouts)
app.set('views', path.join(__dirname, 'views'))
app.set("view engine", "ejs")


// * middlewares
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(sessionConfig)
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())


app.use('/static/admin', express.static(path.join(__dirname, 'public', 'admin')))
app.use('/static/user', express.static(path.join(__dirname, 'public', 'user')))
app.use('/static/auth', express.static(path.join(__dirname, 'public', 'auth')))

// * logger
app.use(logger)


// * routes
app.use('/auth', authRouter)

// * auth middleware
// app.use(auth)

// * admin routes
app.use('/admin', auth, adminCheck, adminRouter)

// * user routes
// app.use('/', userCheck, productRouter)
app.use('/', productRouter)
app.use('/profile', auth, userCheck, profileRouter)
app.use('/cart', auth, userCheck, cartRouter)



// * error handler middleware
app.use(errorHandler)

mongoose.connection.once('connected', () => {
  console.log("connected to mongodb")
  app.listen(PORT, () => console.log(`server is running at port ${PORT}`))
})