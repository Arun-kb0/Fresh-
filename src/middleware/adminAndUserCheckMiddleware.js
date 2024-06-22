

const adminCheck = (req, res, next) => {
  try {
    if (req.session.user.isAdmin) {
      return next()
    } else {
      res.redirect('/')
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}


const userCheck = (req, res, next) => {
  console.log("not user")
  console.log(req.session.user.isAdmin)
  try {
    if (req.session.user.isAdmin === false ) {
      return next()
    } else {
      res.redirect('/admin/')
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}



module.exports = {
  adminCheck,
  userCheck
}