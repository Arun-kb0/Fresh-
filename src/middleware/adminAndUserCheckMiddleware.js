

const adminCheck = (req, res, next) => {
  console.log("admin check")
  try {
    if (req?.session?.user?.isAdmin || !req?.user?.provider) {
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
  console.log("user check")
  console.log(req?.session?.user?.isAdmin)
  try {
    if (req?.session?.user?.isAdmin === false || req?.user?.provider ) {
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