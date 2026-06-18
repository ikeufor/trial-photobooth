const uploadInput =
  document.getElementById("upload")

const cameraMode =
  document.getElementById("cameraMode")

const startCameraBtn =
  document.getElementById("startCamera")

const takePhotoBtn =
  document.getElementById("takePhoto")

const downloadBtn =
  document.getElementById("download")

const video =
  document.getElementById("video")

const canvas =
  document.getElementById("canvas")

const ctx =
  canvas.getContext("2d")

// =========================
// SIZE
// =========================

canvas.width = 757
canvas.height = 1177

// =========================
// PHOTO AREA
// =========================

const PHOTO_X = 16
const PHOTO_Y = 102

const PHOTO_WIDTH = 725
const PHOTO_HEIGHT = 873

// =========================
// FRAME
// =========================

const frame = new Image()

frame.src = "frame.png"

// =========================
// CURRENT IMAGE
// =========================

let currentImage = null

// =========================
// CAMERA
// =========================

let stream = null

async function startCamera() {

  try {

    // stop old stream
    if (stream) {

      stream
        .getTracks()
        .forEach(track => track.stop())
    }

    const facingMode =
      cameraMode.value

    stream =
      await navigator
        .mediaDevices
        .getUserMedia({

          video: {
            facingMode: {
              ideal: facingMode
            }
          },

          audio: false
        })

    video.srcObject = stream

    video.style.display = "block"

    canvas.style.display = "none"

    // FRONT CAMERA MIRROR
    if (facingMode === "user") {

      video.classList.add("mirror")

    } else {

      video.classList.remove("mirror")
    }

  } catch (err) {

    console.error(err)

    alert("Cannot access camera")
  }
}

startCameraBtn.addEventListener(
  "click",
  startCamera
)

// =========================
// DRAW IMAGE
// =========================

function drawImageCover(img) {

  currentImage = img

  canvas.style.display = "block"

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  )

  // =========================
  // COVER CROP
  // =========================

  const imageAspect =
    img.width / img.height

  const frameAspect =
    PHOTO_WIDTH / PHOTO_HEIGHT

  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height

  // image terlalu lebar
  if (imageAspect > frameAspect) {

    sw =
      img.height * frameAspect

    sx =
      (img.width - sw) / 2
  }

  // image terlalu tinggi
  else {

    sh =
      img.width / frameAspect

    sy =
      (img.height - sh) / 2
  }

  // =========================
  // FILTER
  // =========================

  ctx.filter = `
    brightness(1.03)
    contrast(0.9)
    saturate(0.9)
    sepia(0.1)
  `

  // =========================
  // DRAW
  // =========================

  ctx.drawImage(

    img,

    sx,
    sy,
    sw,
    sh,

    PHOTO_X,
    PHOTO_Y,
    PHOTO_WIDTH,
    PHOTO_HEIGHT
  )

  ctx.filter = "none"
}

// =========================
// UPLOAD
// =========================

uploadInput.addEventListener(
  "change",
  e => {

    const file =
      e.target.files[0]

    if (!file) return

    const reader =
      new FileReader()

    reader.onload = () => {

      const img =
        new Image()

      img.onload = () => {

        drawImageCover(img)
      }

      img.src = reader.result
    }

    reader.readAsDataURL(file)
  }
)

// =========================
// CAPTURE
// =========================

takePhotoBtn.addEventListener(
  "click",
  () => {

    if (!stream) return

    const tempCanvas =
      document.createElement("canvas")

    const tempCtx =
      tempCanvas.getContext("2d")

    tempCanvas.width =
      video.videoWidth

    tempCanvas.height =
      video.videoHeight

    const isFrontCamera =
      cameraMode.value === "user"

    // MIRROR FRONT CAMERA
    if (isFrontCamera) {

      tempCtx.translate(
        tempCanvas.width,
        0
      )

      tempCtx.scale(-1, 1)
    }

    tempCtx.drawImage(
      video,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    )

    const capturedImage =
      new Image()

    capturedImage.onload = () => {

      drawImageCover(
        capturedImage
      )
    }

    capturedImage.src =
      tempCanvas.toDataURL(
        "image/png"
      )
  }
)

// =========================
// DOWNLOAD
// =========================

downloadBtn.addEventListener(
  "click",
  () => {

    const exportCanvas =
      document.createElement("canvas")

    const exportCtx =
      exportCanvas.getContext("2d")

    exportCanvas.width = 757
    exportCanvas.height = 1177

    // photo
    exportCtx.drawImage(
      canvas,
      0,
      0
    )

    // frame
    exportCtx.drawImage(
      frame,
      0,
      0,
      757,
      1177
    )

    const link =
      document.createElement("a")

    link.download =
      "photobox.png"

    link.href =
      exportCanvas.toDataURL(
        "image/png"
      )

    link.click()
  }
)
