const userModel = require("../model/userModel")
const {v4: uuid} =  require('uuid')

const oauthGoogleCreateOrCheckUser = async (profile) => {
  try {
    // console.log(profile._json)
    const { given_name, picture, email, email_verified, sub } = profile
    let user

    user = await userModel.findOne({ username: email })
    if (!user) {
      user = await userModel.create({
        userId: sub,
        name: given_name,
        username: email,
        image: picture,
        isVerified: email_verified,
        provider: 'google',
        referralCode: uuid().slice(0, 8),
      })
    }

    const sessionUser = {
      name: user.name,
      username: user.username,
      isAdmin: user.isAdmin,
      userId: user.userId,
      provider: user.provider
    }

    return sessionUser
  } catch (error) {
    console.log(error)
  }
}


const oauthFacebookCreateOrCheckUser = async (profile) => {
  try {
    // console.log(profile)
    const { id, photos, displayName } = profile
    let user = await userModel.findOne({ userId: id })
    if (!user) {
      user = await userModel.create({
        userId: id,
        name: displayName,
        image: photos[0].value,
        isVerified: true,
        provider: 'facebook',
        referralCode: uuid().slice(0, 8),
      })
    }
    const sessionUser = {
      name: user.name,
      username: null,
      isAdmin: user.isAdmin,
      userId: user.userId,
      provider: user.provider
    }
    return sessionUser
  } catch (error) {
    console.error(error)
  }
}


module.exports = {
  oauthGoogleCreateOrCheckUser,
  oauthFacebookCreateOrCheckUser
}