
const auth = (req, res, next) => {
  console.log(req?.user?.provider )
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