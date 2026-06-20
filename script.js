const uploadInput    = document.getElementById("upload")
const cameraMode     = document.getElementById("cameraMode")
const startCameraBtn = document.getElementById("startCamera")
const takePhotoBtn   = document.getElementById("takePhoto")
const downloadBtn    = document.getElementById("download")
const video          = document.getElementById("video")
const previewImg     = document.getElementById("preview")
const placeholder    = document.getElementById("placeholder")
const photoArea      = document.getElementById("photoArea")
const focusRing      = document.getElementById("focusRing")

// =========================
// OFF-SCREEN CANVAS
// Never inserted into DOM — only used for compositing the download.
// Exported at EXPORT_SCALE× the base frame size for a crisp, HD result.
// =========================

const BASE_WIDTH   = 757
const BASE_HEIGHT  = 1177
const EXPORT_SCALE = 3   // bump to 4 for even higher res, but file size grows fast

const canvas = document.createElement("canvas")
canvas.width  = BASE_WIDTH  * EXPORT_SCALE
canvas.height = BASE_HEIGHT * EXPORT_SCALE
const ctx = canvas.getContext("2d")
ctx.imageSmoothingEnabled = true
ctx.imageSmoothingQuality = "high"

// Photo area coordinates, scaled to match the export canvas
const PHOTO_X      = 16   * EXPORT_SCALE
const PHOTO_Y      = 102  * EXPORT_SCALE
const PHOTO_WIDTH  = 725  * EXPORT_SCALE
const PHOTO_HEIGHT = 873  * EXPORT_SCALE

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
      video: {
        facingMode: { ideal: facing },
        // Ask for the highest resolution the device can offer.
        // Browsers cap this to the camera's actual max, so it's safe
        // to ask high — it won't error out on lower-end devices.
        width:  { ideal: 1920 },
        height: { ideal: 1920 }
      },
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
// TAP TO FOCUS
// Tries native camera focus via applyConstraints (Chrome/Android support
// varies, iOS Safari does not support this at all). Always shows the
// visual focus ring regardless, so the UX feels consistent everywhere.
// =========================

photoArea.addEventListener("click", e => {
  // Only meaningful while the live camera is showing
  if (!stream || video.style.display === "none") return

  const rect = photoArea.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // Show visual ring at tap position
  focusRing.style.left = `${x}px`
  focusRing.style.top  = `${y}px`
  focusRing.classList.remove("active")
  // restart animation
  void focusRing.offsetWidth
  focusRing.classList.add("active")

  // Try real focus point via constraints, if supported
  const track = stream.getVideoTracks()[0]
  if (!track) return

  const capabilities = track.getCapabilities ? track.getCapabilities() : {}

  if (capabilities.focusMode && capabilities.focusMode.includes("manual") && capabilities.pointsOfInterest) {
    // Normalize tap coords to 0–1 range, accounting for mirror
    let nx = x / rect.width
    const ny = y / rect.height
    if (cameraMode.value === "user") nx = 1 - nx

    track.applyConstraints({
      advanced: [{
        pointsOfInterest: [{ x: nx, y: ny }],
        focusMode: "manual"
      }]
    }).catch(() => {
      // Some devices report the capability but reject the constraint —
      // fail silently, the visual ring already gave feedback.
    })
  } else if (capabilities.focusMode && capabilities.focusMode.includes("continuous")) {
    // Nudge continuous autofocus to re-evaluate
    track.applyConstraints({
      advanced: [{ focusMode: "continuous" }]
    }).catch(() => {})
  }
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

  ctx.drawImage(img, drawX, drawY, drawW, drawH)
  ctx.restore()

  // 2. Frame overlay on top
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)

  // 3. Trigger download
  const link    = document.createElement("a")
  link.download = "A-Postcard-From-Yahya-Yulia.png"
  link.href     = canvas.toDataURL("image/png")
  link.click()
})

// =========================
// INIT
// =========================

video.style.display   = "none"
clearPreview()
takePhotoBtn.disabled = true
