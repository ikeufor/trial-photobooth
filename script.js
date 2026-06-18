const uploadInput   = document.getElementById("upload")
const cameraMode    = document.getElementById("cameraMode")
const startCameraBtn = document.getElementById("startCamera")
const takePhotoBtn  = document.getElementById("takePhoto")
const downloadBtn   = document.getElementById("download")
const video         = document.getElementById("video")
const canvas        = document.getElementById("canvas")
const placeholder   = document.getElementById("placeholder")
const ctx           = canvas.getContext("2d")

// =========================
// CANVAS SIZE (matches frame.png dimensions)
// =========================

canvas.width  = 757
canvas.height = 1177

// =========================
// PHOTO AREA inside the frame (in canvas pixels)
// Matches the CSS .photo-area percentages × canvas size
// =========================

const PHOTO_X      = 16    // 2.11% × 757
const PHOTO_Y      = 102   // 8.67% × 1177
const PHOTO_WIDTH  = 725   // 95.77% × 757
const PHOTO_HEIGHT = 873   // 74.13% × 1177

// =========================
// FRAME IMAGE
// =========================

const frame = new Image()
frame.src = "frame.png"

// =========================
// STATE
// =========================

let stream      = null
let hasContent  = false   // true once a photo has been captured/uploaded

function setHasContent(val) {
  hasContent = val
  // canvas visible only when there's content
  canvas.style.display    = val ? "block"  : "none"
  placeholder.style.display = val ? "none" : "flex"
  downloadBtn.disabled    = !val
}

function setStreamActive(val) {
  takePhotoBtn.disabled = !val
  // hide canvas when live camera starts; show placeholder instead
  if (val) setHasContent(false)
}

// =========================
// CAMERA
// =========================

async function startCamera() {
  try {
    // stop previous stream
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }

    const facing = cameraMode.value

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing } },
      audio: false
    })

    video.srcObject = stream
    video.style.display = "block"

    video.classList.toggle("mirror", facing === "user")

    setStreamActive(true)

  } catch (err) {
    console.error(err)
    alert("Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan.")
  }
}

startCameraBtn.addEventListener("click", startCamera)

// Re-open with new facing mode when select changes while camera is live
cameraMode.addEventListener("change", () => {
  if (stream) startCamera()
})

// =========================
// DRAW IMAGE ON CANVAS (object-fit: cover logic)
// =========================

function drawCoverImage(img) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Clip to the photo area
  ctx.save()
  ctx.beginPath()
  ctx.rect(PHOTO_X, PHOTO_Y, PHOTO_WIDTH, PHOTO_HEIGHT)
  ctx.clip()

  // Cover scale: fill the area, crop overflow
  const scale = Math.max(
    PHOTO_WIDTH  / img.width,
    PHOTO_HEIGHT / img.height
  )

  const drawW = img.width  * scale
  const drawH = img.height * scale
  const drawX = PHOTO_X + (PHOTO_WIDTH  - drawW) / 2
  const drawY = PHOTO_Y + (PHOTO_HEIGHT - drawH) / 2

  // Subtle film filter
  ctx.filter = "brightness(1.03) contrast(0.92) saturate(0.88) sepia(0.08)"
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.filter = "none"

  ctx.restore()

  setHasContent(true)
}

// =========================
// UPLOAD
// =========================

uploadInput.addEventListener("change", e => {
  const file = e.target.files[0]
  if (!file) return

  // Stop camera if running
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
    video.srcObject = null
    video.style.display = "none"
    setStreamActive(false)
  }

  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => drawCoverImage(img)
    img.src = reader.result
  }
  reader.readAsDataURL(file)
})

// =========================
// CAPTURE
// =========================

takePhotoBtn.addEventListener("click", () => {
  if (!stream) return

  // Draw current video frame to a temp canvas (handles mirroring)
  const tmp    = document.createElement("canvas")
  const tmpCtx = tmp.getContext("2d")
  tmp.width    = video.videoWidth
  tmp.height   = video.videoHeight

  const isFront = cameraMode.value === "user"
  if (isFront) {
    tmpCtx.translate(tmp.width, 0)
    tmpCtx.scale(-1, 1)
  }

  tmpCtx.drawImage(video, 0, 0, tmp.width, tmp.height)

  // Hide the live video feed; show the captured frame
  video.style.display = "none"

  const img = new Image()
  img.onload = () => drawCoverImage(img)
  img.src = tmp.toDataURL("image/png")
})

// =========================
// DOWNLOAD (composite: photo + frame overlay)
// =========================

downloadBtn.addEventListener("click", () => {
  const exp    = document.createElement("canvas")
  const expCtx = exp.getContext("2d")
  exp.width    = 757
  exp.height   = 1177

  // 1. Photo layer
  expCtx.drawImage(canvas, 0, 0)

  // 2. Frame overlay on top
  expCtx.drawImage(frame, 0, 0, 757, 1177)

  const link      = document.createElement("a")
  link.download   = "nama-nama-photobooth.png"
  link.href       = exp.toDataURL("image/png")
  link.click()
})

// =========================
// INIT STATE
// =========================

setHasContent(false)
video.style.display = "none"
takePhotoBtn.disabled = true
downloadBtn.disabled  = true
