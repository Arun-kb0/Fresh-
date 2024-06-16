
const getUsersController = async (req, res) => {
  try {
    res.render('admin/users/usersTable')
  } catch (error) {
    next(error)
  }
}


const getCreateUserController = async (req, res) => {
  try {
    res.render('admin/users/editUser')
  } catch (error) {
    next(error)
  }
}


const getUserEditController = async (req, res) => {
  try {
    res.render('admin/users/editUser')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getUsersController,
  getUserEditController
}