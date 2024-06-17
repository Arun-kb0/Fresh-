const CustomError = require("../constants/CustomError")

const errorHandler = async (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || "internal server error"

  if (err instanceof CustomError) {
    statusCode = err.statusCode
    message = err.message
  }
  console.log(err.message)
  res.status(statusCode).json({ message })
}


module.exports = errorHandler