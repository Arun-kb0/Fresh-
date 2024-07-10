$(function () {


  const imageContainer = $("#imageContainerCropper")
  const cropBtn = $("#cropBtn")
  const imageContainerResult = $("#imageContainerCropperResult")
  const saveBtn = $("#saveBtn")
  const uploadBtn = $("#upload")

  const filename = JSON.parse(localStorage.getItem('filename'))
  const file = JSON.parse(localStorage.getItem(filename))
  saveBtn.hide()


  const image = imageContainer.find('img')
  let cropper

  if (file) {
    image.attr('src', file.data)    
      // * cropper init
      if (image) {
        cropper = new Cropper(image[0], {
          aspectRatio: 1 / 1,
        })
      }
  }

  cropBtn.on("click", handleCrop)
  saveBtn.on("click", handleSave)

  uploadBtn.on("input", handleSelectImage)


  function handleSelectImage(event) {
    const file = event.target.files[0];
    console.log(file)
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const image = imageContainer.find('img');
        image.attr('src', e.target.result);

        if (cropper) {
          cropper.destroy();
        }
        cropper = new Cropper(image[0], {
          aspectRatio: 1 / 1,
        });

        cropBtn.show();
      };
      reader.readAsDataURL(file);
    }
  }

  function handleCrop() {
    saveBtn.show()
    const croppedImage = cropper.getCroppedCanvas().toDataURL('image/png')
    const resultImage = imageContainerResult.find('img')
    resultImage.attr('src', croppedImage)
  }


  function handleSave() {
    const resultImage = imageContainerResult.find('img')
    const resultImageDataUrl = resultImage.attr('src')
    let croppedImages = JSON.parse(localStorage.getItem('cropped')) || []
    croppedImages.push(resultImageDataUrl)
    window.localStorage.setItem('cropped', JSON.stringify(croppedImages))
    window.localStorage.removeItem(filename)
    window.localStorage.removeItem('filename')

    // * download image
    const link = document.createElement('a');
    link.href = resultImageDataUrl;
    link.download = 'cropped_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


})