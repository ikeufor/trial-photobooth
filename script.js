const upload = document.getElementById("upload")
const cameraSelect = document.getElementById("cameraSelect")

const openCameraBtn = document.getElementById("openCamera")
const captureBtn = document.getElementById("capture")
const downloadBtn = document.getElementById("download")

const video = document.getElementById("video")

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

// FRAME SIZE
canvas.width = 757
canvas.height = 1177

// FOTO AREA
const photoX = 16
const photoY = 102

const photoWidth = 725
const photoHeight = 873

const frame = new Image()
frame.src = "frame.png"

let currentImage = null
let stream = null

// DRAW SEMUA
function drawFinalImage(img) {

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // ukuran asli image
  const imgWidth = img.width
  const imgHeight = img.height

  // cover/fill logic
  const scale = Math.max(
    photoWidth / imgWidth,
    photoHeight / imgHeight
  )

  const drawWidth = imgWidth * scale
  const drawHeight = imgHeight * scale

  // center crop
  const x = photoX - (drawWidth - photoWidth) / 2
  const y = photoY - (drawHeight - photoHeight) / 2

  ctx.drawImage(
    img,
    x,
    y,
    drawWidth,
    drawHeight
  )

  // overlay frame
  ctx.drawImage(
    frame,
    0,
    0,
    canvas.width,
    canvas.height
  )
}

// LOAD FRAME
frame.onload = () => {
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
}

// UPLOAD FOTO
upload.addEventListener("change", (e) => {

  const file = e.target.files[0]

  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {

    const img = new Image()

    img.onload = () => {
      currentImage = img
      drawFinalImage(img)
    }

    img.src = reader.result
  }

  reader.readAsDataURL(file)
})

// OPEN CAMERA
openCameraBtn.addEventListener("click", async () => {

  // stop stream lama
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }

  const facingMode = cameraSelect.value

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: facingMode
    },
    audio: false
  })

  video.srcObject = stream

  video.style.display = "block"
})

// CAPTURE
captureBtn.addEventListener("click", () => {

  if (!stream) return

  const tempCanvas = document.createElement("canvas")
  const tempCtx = tempCanvas.getContext("2d")

  tempCanvas.width = video.videoWidth
  tempCanvas.height = video.videoHeight

  // PENTING:
  // supaya front camera tidak mirror

  tempCtx.translate(tempCanvas.width, 0)
  tempCtx.scale(-1, 1)

  tempCtx.drawImage(
    video,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  )

  const capturedImage = new Image()

  capturedImage.onload = () => {

    currentImage = capturedImage

    drawFinalImage(capturedImage)
  }

  capturedImage.src = tempCanvas.toDataURL("image/png")

  // matikan kamera
  stream.getTracks().forEach(track => track.stop())

  video.style.display = "none"
})

// DOWNLOAD
downloadBtn.addEventListener("click", () => {

  const link = document.createElement("a")

  link.download = "photobox.png"

  link.href = canvas.toDataURL("image/png")

  link.click()
})
