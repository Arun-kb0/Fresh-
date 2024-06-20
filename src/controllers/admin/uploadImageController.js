const { firebaseApp } = require("../../config/firebaseConfig")
const { getStorage, ref, getDownloadURL, uploadBytesResumable } = require('firebase/storage')
const { OK } = require("../../constants/httpStatusCodes")
const { format } = require('date-fns')


const storage = getStorage(firebaseApp)

const uploadImageToFirebase = async (req, res, next) => {
  const { file } = req
  try {
    const dateTime = Date.now()
    const formattedDate = format(dateTime, 'dd-MM-yyyy-HH:mm:ss')
    
    const storageRef = ref(storage, `products/${file.originalname}-${formattedDate}`)
    const metadata = {
      contentType: file.mimetype
    }
    const snapshot = await uploadBytesResumable(storageRef, file.buffer, metadata)
    const downloadedUrl = await getDownloadURL(snapshot.ref)

    res.status(OK).json({ message: "file uploaded", downloadedUrl })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

