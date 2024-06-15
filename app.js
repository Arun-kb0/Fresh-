const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const expressEjsLayouts = require("express-ejs-layouts")
const path = require('path')

const connectDB = require('./src/config/dbConnection')
const sessionConfig = require('./src/config/sessionConfig')
const authRouter = require('./src/routes/authRoutes')
const { error } = require('console')
const errorHandler = require('./src/middleware/errorHandler')

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
app.use(sessionConfig)


// * static files
// app.use(express.static(path.join(__dirname, 'public/user')))
// app.use(express.static(path.join(__dirname, 'public', 'admin')))
// app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')))

app.use('/static',express.static(path.join(__dirname, 'public', 'admin')))

// * routes
app.use('/auth', authRouter)


// * error handler middleware
app.use(errorHandler)

mongoose.connection.once('connected', () => {
  console.log("connected to mongodb")
  app.listen(PORT, () => console.log(`server is running at port ${PORT}`))
})