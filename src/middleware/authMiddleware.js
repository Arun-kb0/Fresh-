const { UNAUTHORIZED } = require("../constants/httpStatusCodes")

const auth = (req, res, next) => {
  console.log(req.path)
  try {
    if (req.session.isAuthorized === true) {
      return next()
    }

    if (req?.session?.user?.isAdmin) {
      res.redirect('/auth/admin/login')
    } else {
      res.redirect('/auth/login')
    }

  } catch (error) {
    console.log(error)
    res.status(500).json({message:error.message})
  }
}


module.exports = {
  auth
}