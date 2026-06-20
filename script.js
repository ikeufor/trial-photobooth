const uploadInput    = document.getElementById("upload")
const cameraMode     = document.getElementById("cameraMode")
const startCameraBtn = document.getElementById("startCamera")
const takePhotoBtn   = document.getElementById("takePhoto")
const downloadBtn    = document.getElementById("download")
const video          = document.getElementById("video")
const previewImg     = document.getElementById("preview")
const placeholder    = document.getElementById("placeholder")

// =========================
// OFF-SCREEN CANVAS
// Never inserted into DOM — only used for compositing the download.
// =========================

const canvas = document.createElement("canvas")
canvas.width  = 757
canvas.height = 1177
const ctx = canvas.getContext("2d")

// Photo area coordinates inside the 757×1177 canvas
const PHOTO_X      = 16
const PHOTO_Y      = 102
const PHOTO_WIDTH  = 725
const PHOTO_HEIGHT = 873

// =========================
// FRAME
// =========================

const frame = new Image()
frame.src = "frame.png"

// =========================
// STATE
// =========================

let stream = null

// lastSourceImg: the raw Image object of the last capture/upload.
// Kept so we can composite it on-demand at download time.
let lastSourceImg = null

function showPreview(img) {
  lastSourceImg = img

  // --- DOM preview: just set src on the <img> tag.
  //     object-fit: cover in CSS handles fill perfectly — no black bars.
  previewImg.src = img.src
  previewImg.style.display = "block"
  placeholder.style.display = "none"
  downloadBtn.disabled = false
}

function clearPreview() {
  previewImg.style.display = "none"
  placeholder.style.display = "flex"
  downloadBtn.disabled = true
  lastSourceImg = null
}

function setStreamActive(active) {
  takePhotoBtn.disabled = !active
  if (active) {
    // Live camera is running — hide the still preview
    previewImg.style.display = "none"
    placeholder.style.display = "none"
  }
}

// =========================
// CAMERA
// =========================

async function startCamera() {
  try {
    if (stream) stream.getTracks().forEach(t => t.stop())

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

cameraMode.addEventListener("change", () => {
  if (stream) startCamera()
})

// =========================
// CAPTURE
// =========================

takePhotoBtn.addEventListener("click", () => {
  if (!stream) return

  // Snapshot video frame into a temp canvas (handles mirror flip)
  const tmp    = document.createElement("canvas")
  const tmpCtx = tmp.getContext("2d")
  tmp.width    = video.videoWidth
  tmp.height   = video.videoHeight

  if (cameraMode.value === "user") {
    tmpCtx.translate(tmp.width, 0)
    tmpCtx.scale(-1, 1)
  }
  tmpCtx.drawImage(video, 0, 0, tmp.width, tmp.height)

  // Stop stream and hide video
  stream.getTracks().forEach(t => t.stop())
  stream = null
  video.style.display = "none"
  takePhotoBtn.disabled = true

  // Load snapshot into an Image and show it via <img> tag
  const img = new Image()
  img.onload = () => showPreview(img)
  img.src = tmp.toDataURL("image/png")
})

// =========================
// UPLOAD
// =========================

uploadInput.addEventListener("change", e => {
  const file = e.target.files[0]
  if (!file) return

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
    img.onload = () => showPreview(img)
    img.src = reader.result
  }
  reader.readAsDataURL(file)
})

// =========================
// DOWNLOAD
// Composites the photo + frame on the off-screen canvas,
// applying cover-crop to fit PHOTO_X/Y/WIDTH/HEIGHT exactly.
// =========================

downloadBtn.addEventListener("click", () => {
  if (!lastSourceImg) return

  const img = lastSourceImg

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. Draw photo with cover crop into PHOTO area
  ctx.save()
  ctx.beginPath()
  ctx.rect(PHOTO_X, PHOTO_Y, PHOTO_WIDTH, PHOTO_HEIGHT)
  ctx.clip()

  const scale = Math.max(
    PHOTO_WIDTH  / img.naturalWidth,
    PHOTO_HEIGHT / img.naturalHeight
  )
  const drawW = img.naturalWidth  * scale
  const drawH = img.naturalHeight * scale
  const drawX = PHOTO_X + (PHOTO_WIDTH  - drawW) / 2
  const drawY = PHOTO_Y + (PHOTO_HEIGHT - drawH) / 2

  ctx.filter = "contrast(1.06) saturate(1.08) brightness(1.02)"
  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.filter = "none"
  ctx.restore()

  // 2. Frame overlay on top
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)

  // 3. Trigger download
  const link    = document.createElement("a")
  link.download = "nama-nama-photobooth.png"
  link.href     = canvas.toDataURL("image/png")
  link.click()
})

// =========================
// INIT
// =========================

video.style.display   = "none"
clearPreview()
takePhotoBtn.disabled = true
