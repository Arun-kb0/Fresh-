const { viewPageNotFound } = require("../constants/pageConfid")


const handleNotFound = async (req, res, next) => {
  try {
    if (req?.session?.user?.isAdmin) {
      res.render('user/notfound/notFound', { ...viewPageNotFound  , backToAdmin:true })
    } else {
      res.render('user/notfound/notFound', { ...viewPageNotFound, backToAdmin: false })
    }

  } catch (error) {
    next(error)
  }
}

module.exports = {
  handleNotFound
}