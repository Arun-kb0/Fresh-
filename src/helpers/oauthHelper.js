const userModel = require("../model/userModel")

const oauthGoogleCreateOrCheckUser = async (profile) => {
  try {
    // console.log(profile._json)
    const { given_name, picture, email, email_verified } = profile
    let user
    user = await userModel.findOne({ username: email })
    if (!user) {
      user = await userModel.create({
        name: given_name,
        username: email,
        image: picture,
        isVerified: email_verified,
      })
    }
    return user
  } catch (error) {
    console.log(error)
  }
}


const oauthFacebookCreateOrCheckUser = async (profile) => {
  try {
    console.log(profile)
    const { id, photos, displayName } = profile
    // const user = {
    //   userId: id,
    //   name: displayName,
    //   image: photos[0].value,
    //   isVerified: true,
    //   provider:'facebook'
    // }
    let user = await userModel.findOne({ userId: id })
    if (!user) {
      user = await userModel.create({
        userId: id,
        name: displayName,
        image: photos[0].value,
        isVerified: true,
        provider: 'facebook'
      })
    }
    return user
  } catch (error) {
    console.error(error)
  }
}

// _json: {
//   id: '122157406718091971',
//     name: 'Arun Kb',
//       picture: { data: [Object] }
// }

module.exports = {
  oauthGoogleCreateOrCheckUser,
  oauthFacebookCreateOrCheckUser
}