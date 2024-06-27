const { firebaseApp } = require("../config/firebaseConfig")
const { getStorage, ref, getDownloadURL, uploadBytesResumable } = require('firebase/storage')
const { format } = require('date-fns')
const sharp = require('sharp')
const CustomError = require('../constants/CustomError')

const storage = getStorage(firebaseApp)

const uploadImageToFirebase = async (file, directory) => {
  try {
    console.log(file)

    const processedBuffer = await sharp(file.buffer)
      .resize({
        width: 420,
        height: 420,
        fit: 'cover',
      })
      .toBuffer()

    if (!Buffer.isBuffer(processedBuffer)) {
      throw new CustomError("invalid buffer ")
    }
    file.buffer = processedBuffer

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