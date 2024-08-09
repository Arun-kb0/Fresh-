const adminAuth = (req, res, next) => {
  try {
    if (req.cookies.adminSession) {
      return next()
    }
    res.redirect('/auth/admin/login')
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


const userAuth = (req, res, next) => {
  try {
    if (req.cookies.user) {
      return next()
    }
    res.redirect('/auth/login')
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  adminAuth,
  userAuth
}