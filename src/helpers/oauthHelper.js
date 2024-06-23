const userModel = require("../model/userModel")

const oauthCreateOrCheckUser = async (req, profile) => {
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

module.exports = {
  oauthCreateOrCheckUser
}

// _json: {
//   sub: '116535338502398400509',
//     name: 'Arun KB BCR62',
//       given_name: 'Arun',
//         family_name: 'KB BCR62',
//           picture: 'https://lh3.googleusercontent.com/a/ACg8ocIw5iym5VA3Z5ILaaM-onugDfS3JsavtUBGMpLmoTJDIsNeLks=s96-c',
//             email: 'arun11.kb@gmail.com',
//               email_verified: true
// }