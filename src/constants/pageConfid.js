
const viewUsersPage = {
  isAdmin: false,
  isAuthPage:false,
  isPageNotFound:false
}

const viewAdminPage = {
  isAdmin: true,
  isAuthPage: false,
  isPageNotFound:false
}

const viewAuthPage = {
  isAdmin: false,
  isAuthPage: true,
  isPageNotFound:false
}

const viewAdminAuthPage = {
  isAdmin: true,
  isAuthPage: true,
  isPageNotFound:false
}

const viewPageNotFound = {
  isAdmin: false,
  isAuthPage: true,
  isPageNotFound:true
}


module.exports = {
  viewAdminPage,
  viewAuthPage,
  viewUsersPage,
  viewPageNotFound,
  viewAdminAuthPage
}