const { OK } = require("../../constants/httpStatusCodes")
const {  viewAdminPage } = require("../../constants/pageConfid")
const userModel = require("../../model/userModel")


const getUsersController = async (req, res, next) => {
  try {
    const users = await userModel.find({})
    // res.status(OK).json({ users })
    res.render('admin/users/usersTable', {...viewAdminPage, users})
  } catch (error) {
    next(error)
  }
}

const blockUserController = async (req, res, next) => {
  const { userId } = req.query
  try {
    // console.log(userId)
    const user = await userModel.findOneAndUpdate(
      { _id: userId, },
      [{
        $set: {
          isBlocked: { $not: "$isBlocked" }
        }
      }],
      { new: true }
    )
    if (user.isBlocked) {
      res.status(OK).json({ message: `${user.name} blocked`,user })
      return
    }
    res.status(OK).json({ message: `${user.name}  unblocked`,user })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getUsersController,
  blockUserController
}