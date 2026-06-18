const uploadInput = document.getElementById("upload")

const cameraMode = document.getElementById("cameraMode")

const startCameraBtn = document.getElementById("startCamera")

const takePhotoBtn = document.getElementById("takePhoto")

const downloadBtn = document.getElementById("download")

const video = document.getElementById("video")

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

// =========================
// FRAME SIZE
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
// FRAME IMAGE
// =========================

const frame = new Image()
frame.src = "frame.png"

frame.onload = () => {
  drawEmpty()
}

// =========================
// CAMERA
// =========================

let stream = null

async function startCamera() {

  try {

    // stop camera lama
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }

    const facingMode = cameraMode.value

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          exact: facingMode
        }
      },
      audio: false
    })

    video.srcObject = stream

    video.style.display = "block"

  } catch (err) {

    // fallback kalau facingMode exact gagal

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: cameraMode.value
      },
      audio: false
    })

    video.srcObject = stream

    video.style.display = "block"
  }
}

startCameraBtn.addEventListener("click", startCamera)

// =========================
// DRAW EMPTY
// =========================

function drawEmpty() {

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.drawImage(
    frame,
    0,
    0,
    canvas.width,
    canvas.height
  )
}

// =========================
// DRAW IMAGE COVER
// =========================

function drawCoverImage(img) {

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // clipping area
  ctx.save()

  ctx.beginPath()

  ctx.rect(
    PHOTO_X,
    PHOTO_Y,
    PHOTO_WIDTH,
    PHOTO_HEIGHT
  )

  ctx.clip()

  const imageWidth = img.width
  const imageHeight = img.height

  // COVER ALGORITHM
  const scale = Math.max(
    PHOTO_WIDTH / imageWidth,
    PHOTO_HEIGHT / imageHeight
  )

  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale

  // CENTER
  const drawX =
    PHOTO_X + (PHOTO_WIDTH - drawWidth) / 2

  const drawY =
    PHOTO_Y + (PHOTO_HEIGHT - drawHeight) / 2

  ctx.drawImage(
    img,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  )

  ctx.restore()

  // FRAME DI ATAS
  ctx.drawImage(
    frame,
    0,
    0,
    canvas.width,
    canvas.height
  )
}

// =========================
// UPLOAD IMAGE
// =========================

uploadInput.addEventListener("change", e => {

  const file = e.target.files[0]

  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {

    const img = new Image()

    img.onload = () => {
      drawCoverImage(img)
    }

    img.src = reader.result
  }

  reader.readAsDataURL(file)
})

// =========================
// CAPTURE CAMERA
// =========================

takePhotoBtn.addEventListener("click", () => {

  if (!stream) return

  const tempCanvas =
    document.createElement("canvas")

  const tempCtx =
    tempCanvas.getContext("2d")

  tempCanvas.width = video.videoWidth
  tempCanvas.height = video.videoHeight

  // PENTING:
  // TIDAK MIRROR
  // draw langsung apa adanya

  tempCtx.drawImage(
    video,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  )

  const img = new Image()

  img.onload = () => {
    drawCoverImage(img)
  }

  img.src = tempCanvas.toDataURL("image/png")

  // stop camera
  stream.getTracks().forEach(track => track.stop())

  video.style.display = "none"
})

// =========================
// DOWNLOAD
// =========================

downloadBtn.addEventListener("click", () => {

  const link =
    document.createElement("a")

  link.download = "photobox.png"

  link.href =
    canvas.toDataURL("image/png")

  link.click()
})
