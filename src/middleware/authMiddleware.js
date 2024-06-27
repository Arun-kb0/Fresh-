
const auth = (req, res, next) => {
  console.log("auth middleware")
  console.log(req?.user?.provider)
  console.log(req?.user)
  console.log(req?.session)
  
  
  try {
    if (req?.session?.isAuthorized === true 
      || req?.user?.provider ==='google'
    ) {
      return next()
    }

    if (req?.session?.user?.isAdmin) {
      res.redirect('/auth/admin/login')
    } else {
      res.redirect('/auth/login')
    }

  } catch (error) {
    res.status(500).json({message:error.message})
  }
}


module.exports = {
  auth
}