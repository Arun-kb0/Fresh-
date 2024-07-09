

const adminCheck = (req, res, next) => {
  console.log("admin check")
  console.log(req?.session?.user?.isAdmin)
  try {
    if (req?.session?.user?.isAdmin) {
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

    if (req?.session?.user?.isAdmin === false ||
      userData?.isAdmin === false
    ) {
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