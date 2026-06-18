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
// CANVAS SIZE
// =========================

canvas.width = 757
canvas.height = 1177

// =========================
// PHOTO AREA
// =========================

const PHOTO_X = 50;
const PHOTO_Y = 102;

const PHOTO_WIDTH = 659;
const PHOTO_HEIGHT = 870;

// =========================
// FRAME
// =========================

const frame = new Image()

frame.src = "frame.png"

// =========================
// CAMERA
// =========================

let stream = null

async function startCamera() {

  try {

    // stop previous stream
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

function drawCoverImage(img) {
  canvas.style.display = "block"
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 1. CLIP & GAMBAR FOTO
  ctx.save()
  ctx.beginPath()
  ctx.rect(PHOTO_X, PHOTO_Y, PHOTO_WIDTH, PHOTO_HEIGHT)
  ctx.clip()
  
  const imageWidth = img.width
  const imageHeight = img.height
  
  const scale = Math.max(
    PHOTO_WIDTH / imageWidth,
    PHOTO_HEIGHT / imageHeight
  )
  
  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale
  
  const drawX = PHOTO_X + (PHOTO_WIDTH - drawWidth) / 2
  const drawY = PHOTO_Y + (PHOTO_HEIGHT - drawHeight) / 2
  
  ctx.filter = `brightness(1.03) contrast(0.9) saturate(0.9) sepia(0.1)`
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
  ctx.filter = "none"
  ctx.restore()

  // 2. TAMBAHKAN INI: Langsung gambar frame di atas foto pada canvas yang sama
  if (frame.complete) {
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
  } else {
    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
    }
  }
}

// =========================
// UPLOAD IMAGE
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

        drawCoverImage(img)
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

    // mirror front camera
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

    const img =
      new Image()

    img.onload = () => {

      drawCoverImage(img)
    }

    img.src =
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

    exportCtx.drawImage(
      canvas,
      0,
      0
    )

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
      "yahya-yulia-photobooth.png"

    link.href =
      exportCanvas.toDataURL(
        "image/png"
      )

    link.click()
  }
)
