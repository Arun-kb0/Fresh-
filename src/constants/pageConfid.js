
const viewUsersPage = {
  isAdmin: false,
  isAuthPage:false
}

const viewAdminPage = {
  isAdmin: true,
  isAuthPage: false
}

const viewAuthPage = {
  isAdmin: false,
  isAuthPage: true
}

module.exports = {
  viewAdminPage,
  viewAuthPage,
  viewUsersPage
}