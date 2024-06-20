const { firebaseApp } = require("../config/firebaseConfig")
const { getStorage, ref, getDownloadURL, uploadBytesResumable } = require('firebase/storage')
const { format } = require('date-fns')


const storage = getStorage(firebaseApp)

const uploadImageToFirebase = async (file, directory) => {
  try {
    const dateTime = Date.now()
    const formattedDate = format(dateTime, 'dd-MM-yyyy-HH:mm:ss')
    const fileName = `${file.originalname}-${formattedDate}`
    const storageRef = ref(storage, `${directory}/${fileName}`)
    const metadata = {
      contentType: file.mimetype
    }
    const snapshot = await uploadBytesResumable(storageRef, file.buffer, metadata)
    const downloadedUrl = await getDownloadURL(snapshot.ref)
    const image = {
      fileName,
      originalName: file.originalname,
      path: downloadedUrl,
    }
    return image
  } catch (error) {
    console.error(error)
  }
}


module.exports = {
  uploadImageToFirebase
}