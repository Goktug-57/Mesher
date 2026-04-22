let sourceImage = new Image();
let imageLoaded = false;

// Tab Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.target).classList.add('active');
    });
});

// Image Upload Logic
document.getElementById('input-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        sourceImage.src = event.target.result;
        sourceImage.onload = () => {
            imageLoaded = true;
            document.getElementById('img-status').innerText = `Loaded: ${sourceImage.width}x${sourceImage.height}px`;
            calculateY();
        };
    };
    reader.readAsDataURL(file);
});

// Aspect Ratio Auto-Calculation
const inputX = document.getElementById('cell-count-x');
const inputY = document.getElementById('cell-count-y');

function calculateY() {
    if (!imageLoaded || !inputX.value) return;
    const aspect = sourceImage.height / sourceImage.width;
    inputY.value = Math.round(parseInt(inputX.value) * aspect);
}

inputX.addEventListener('input', calculateY);

// Generate Engine
document.getElementById('btn-generate').addEventListener('click', () => {
    const warningMsg = document.getElementById('warning-msg');
    warningMsg.innerText = "";

    if (!imageLoaded) {
        warningMsg.innerText = "Error: No source image loaded.";
        return;
    }

    const countX = parseInt(inputX.value);
    if (!countX || countX <= 0) {
        warningMsg.innerText = "Error: Cell Count X is required.";
        return;
    }

    const countY = parseInt(inputY.value);
    const cellWidth = parseInt(document.getElementById('cell-width').value) || 25;
    
    const useBorder = document.getElementById('enable-border').checked;
    const borderThick = useBorder ? parseInt(document.getElementById('border-thickness').value) : 0;
    const borderCol = document.getElementById('border-color').value;

    // Step 1: Exact Downsampling (Eliminates Blurry Mud)
    const downCanvas = document.createElement('canvas');
    downCanvas.width = countX;
    downCanvas.height = countY;
    const downCtx = downCanvas.getContext('2d', { willReadFrequently: true });
    
    // Disable anti-aliasing completely
    downCtx.imageSmoothingEnabled = false;
    downCtx.drawImage(sourceImage, 0, 0, countX, countY);
    const pixelData = downCtx.getImageData(0, 0, countX, countY).data;

    // Step 2: Calculate Final Matrix Dimensions
    const totalCellSize = cellWidth + borderThick;
    const finalWidth = (countX * totalCellSize) + borderThick;
    const finalHeight = (countY * totalCellSize) + borderThick;

    // Step 3: Render Exact Pixels to Output
    const renderCanvas = document.getElementById('render-canvas');
    renderCanvas.width = finalWidth;
    renderCanvas.height = finalHeight;
    const ctx = renderCanvas.getContext('2d');
    
    // Fill background with border color if enabled
    if (useBorder) {
        ctx.fillStyle = borderCol;
        ctx.fillRect(0, 0, finalWidth, finalHeight);
    }

    let i = 0;
    for (let y = 0; y < countY; y++) {
        for (let x = 0; x < countX; x++) {
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];
            const a = pixelData[i + 3];
            
            const drawX = borderThick + (x * totalCellSize);
            const drawY = borderThick + (y * totalCellSize);

            ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
            ctx.fillRect(drawX, drawY, cellWidth, cellWidth);
            i += 4;
        }
    }

    // Step 4: Export Binary Blob
    renderCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Mosaic_Output.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
});