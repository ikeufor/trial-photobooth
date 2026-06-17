const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const photoInput = document.getElementById("photoInput");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");

// ukuran asli frame
canvas.width = 1365;
canvas.height = 2048;

// =====================
// FRAME
// =====================

const frame = new Image();

frame.onload = () => {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.drawImage(
        frame,
        0,
        0,
        canvas.width,
        canvas.height
    );

};

frame.src = "assets/frame.png";


// =====================
// LOAD IMAGE
// =====================

function loadImage(file) {

    return new Promise((resolve, reject) => {

        const img = new Image();

        img.onload = () => resolve(img);

        img.onerror = reject;

        img.src = URL.createObjectURL(file);

    });

}


// =====================
// OBJECT FIT COVER
// =====================

function drawCoverImage(
    ctx,
    img,
    x,
    y,
    w,
    h
) {

    const imageRatio =
        img.width / img.height;

    const frameRatio =
        w / h;

    let sx;
    let sy;
    let sw;
    let sh;

    if (imageRatio > frameRatio) {

        sh = img.height;
        sw = sh * frameRatio;

        sx =
            (img.width - sw) / 2;

        sy = 0;

    } else {

        sw = img.width;

        sh =
            sw / frameRatio;

        sx = 0;

        sy =
            (img.height - sh) / 2;

    }

    ctx.drawImage(
        img,
        sx,
        sy,
        sw,
        sh,
        x,
        y,
        w,
        h
    );

}


// =====================
// GENERATE
// =====================

generateBtn.addEventListener(
    "click",
    async () => {

        const files =
            photoInput.files;

        if (files.length !== 4) {

            alert(
                "Please upload exactly 4 photos."
            );

            return;

        }

        try {

            const images = [];

            for (
                let i = 0;
                i < 4;
                i++
            ) {

                const img =
                    await loadImage(
                        files[i]
                    );

                images.push(img);

            }

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            // =====================
            // SLOTS
            // =====================

            const slots = [

                // LEFT 1
                {
                    x: 44,
                    y: 195,
                    w: 588,
                    h: 413
                },

                // LEFT 2
                {
                    x: 44,
                    y: 640,
                    w: 588,
                    h: 413
                },

                // LEFT 3
                {
                    x: 44,
                    y: 1085,
                    w: 588,
                    h: 413
                },

                // LEFT 4
                {
                    x: 44,
                    y: 1530,
                    w: 588,
                    h: 413
                },

                // RIGHT 1
                {
                    x: 733,
                    y: 96,
                    w: 588,
                    h: 413
                },

                // RIGHT 2
                {
                    x: 733,
                    y: 541,
                    w: 588,
                    h: 413
                },

                // RIGHT 3
                {
                    x: 733,
                    y: 986,
                    w: 588,
                    h: 413
                },

                // RIGHT 4
                {
                    x: 733,
                    y: 1431,
                    w: 588,
                    h: 413
                }

            ];

            // isi 8 kotak dari 4 foto

            for (
                let i = 0;
                i < 8;
                i++
            ) {

                const img =
                    images[i % 4];

                const slot =
                    slots[i];

                drawCoverImage(
                    ctx,
                    img,
                    slot.x,
                    slot.y,
                    slot.w,
                    slot.h
                );

            }

            // frame di atas foto

            ctx.drawImage(
                frame,
                0,
                0,
                canvas.width,
                canvas.height
            );

        } catch (error) {

            console.error(error);

            alert(
                "Failed to generate photobox."
            );

        }

    }
);


// =====================
// DOWNLOAD
// =====================

downloadBtn.addEventListener(
    "click",
    () => {

        const link =
            document.createElement(
                "a"
            );

        link.download =
            "photobox.png";

        link.href =
            canvas.toDataURL(
                "image/png"
            );

        link.click();

    }
);
