const uploadInput = document.getElementById("upload")
const cameraBtn = document.getElementById("cameraBtn")
const captureBtn = document.getElementById("captureBtn")
const downloadBtn = document.getElementById("downloadBtn")

const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const frame = new Image()
frame.src = "frame.png"

canvas.width = 1080
canvas.height = 1350

let userImage = null
let stream = null

// posisi foto
let imgX = 25
let imgY = 135

// ukuran area foto
let imgWidth = 1030
let imgHeight = 1010

// zoom
let scale = 1

// drag
let dragging = false
let startX = 0
let startY = 0

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (userImage) {

    const drawWidth = imgWidth * scale
    const drawHeight = imgHeight * scale

    ctx.drawImage(
      userImage,
      imgX,
      imgY,
      drawWidth,
      drawHeight
    )
  }

  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
}

frame.onload = () => {
  drawCanvas()
}

// upload foto
uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0]

  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {
    userImage = new Image()

    userImage.onload = () => {
      drawCanvas()
    }

    userImage.src = reader.result
  }

  reader.readAsDataURL(file)
})

// buka kamera
cameraBtn.addEventListener("click", async () => {

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user"
    }
  })

  video.srcObject = stream
  video.style.display = "block"
})

// capture kamera
captureBtn.addEventListener("click", () => {

  if (!video.srcObject) return

  userImage = document.createElement("canvas")
  userImage.width = video.videoWidth
  userImage.height = video.videoHeight

  const tempCtx = userImage.getContext("2d")

  tempCtx.drawImage(
    video,
    0,
    0,
    userImage.width,
    userImage.height
  )

  drawCanvas()

  // matikan kamera
  stream.getTracks().forEach(track => track.stop())

  video.style.display = "none"
})

// download hasil
downloadBtn.addEventListener("click", () => {

  const link = document.createElement("a")

  link.download = "photobox.png"
  link.href = canvas.toDataURL("image/png")

  link.click()
})

// DRAG FOTO

canvas.addEventListener("pointerdown", (e) => {
  dragging = true

  startX = e.clientX
  startY = e.clientY
})

canvas.addEventListener("pointermove", (e) => {

  if (!dragging) return

  const dx = (e.clientX - startX) * 2
  const dy = (e.clientY - startY) * 2

  imgX += dx
  imgY += dy

  startX = e.clientX
  startY = e.clientY

  drawCanvas()
})

canvas.addEventListener("pointerup", () => {
  dragging = false
})

// zoom pakai scroll
canvas.addEventListener("wheel", (e) => {

  e.preventDefault()

  if (e.deltaY > 0) {
    scale -= 0.05
  } else {
    scale += 0.05
  }

  if (scale < 0.2) scale = 0.2
  if (scale > 3) scale = 3

  drawCanvas()
})
