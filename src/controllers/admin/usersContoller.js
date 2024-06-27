const { OK } = require("../../constants/httpStatusCodes")
const { viewAdminPage } = require("../../constants/pageConfid")
const userModel = require("../../model/userModel")


const getUsersController = async (req, res, next) => {
  const { page = 1 } = req.query
  try {
    const LIMIT = 10
    const startIndex = (Number(page) - 1) * LIMIT
    const total = await userModel.countDocuments({ isDeleted: false })
    const numberOfPages = Math.ceil(total / LIMIT)

    const users = await userModel.find({})
      .sort({ name: 1 }).skip(startIndex).limit(LIMIT)
    console.log(numberOfPages)
    res.render('admin/users/usersTable', {
      ...viewAdminPage,
      users,
      page: Number(page),
      numberOfPages: numberOfPages===0 ? 1 : numberOfPages,
    })
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
      res.status(OK).json({ message: `${user.name} blocked`, user })
      return
    }
    res.status(OK).json({ message: `${user.name}  unblocked`, user })
  } catch (error) {
    next(error)
  }
}


module.exports = {
  getUsersController,
  blockUserController
}