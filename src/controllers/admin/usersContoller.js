const { OK } = require("../../constants/httpStatusCodes")
const userModel = require("../../model/userModel")


const getUsersController = async (req, res, next) => {
  try {
    const users = await userModel.find({ isBlocked: false })
    res.status(OK).json({ users })
    // res.render('admin/users/usersTable', { isAuthPage: false,users })
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
      res.status(OK).json({ message: `${user.name} blocked` })
      return
    }
    res.status(OK).json({ message: `${user.name}  unblocked` })
    console.log(user)
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getUsersController,
  blockUserController
}