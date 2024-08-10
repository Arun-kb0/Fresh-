

const adminCheck = (req, res, next) => {
  console.log("admin check")
  // console.log(req?.session?.user?.isAdmin)
  // console.log(req.cookies.adminSession)
  try {
    // if (req?.session?.user?.isAdmin) {
    if (req?.cookies?.adminSession){
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
  try {
    let userData
    if (req?.cookies?.user) {
      userData = JSON.parse(req?.cookies?.user)
    }
    // console.log("user cookie ")
    // console.log(userData)
    // console.log("session user cookie ")
    // console.log(req?.session?.user)
    console.log(req.cookies.user)

    if (req?.cookies?.user) {
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