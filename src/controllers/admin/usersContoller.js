
const getUsersController = async (req, res) => {
  try {
    res.render('admin/users/usersTable', { isAuthPage: false })
  } catch (error) {
    next(error)
  }
}


const getCreateUserController = async (req, res) => {
  try {
    res.render('admin/users/editUser', { isAuthPage: false })
  } catch (error) {
    next(error)
  }
}


const getUserEditController = async (req, res) => {
  try {
    res.render('admin/users/editUser', { isAuthPage: false })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getUsersController,
  getUserEditController
}