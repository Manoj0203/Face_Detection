// 1. CHANGE THIS to the IP address shown on your ESP32 OLED
const ESP32_IP = "10.147.197.188"; 

const classifier = new EdgeImpulseClassifier();
let isProcessing = false;

// Function to send data to ESP32 via Wi-Fi
async function sendToHardware(name) {
    if (isProcessing) return;
    isProcessing = true;
    
    try {
        const url = `http://${ESP32_IP}/update?name=${name}`;
        // 'no-cors' mode is often needed for local ESP32 requests
        await fetch(url, { mode: 'no-cors' });
        console.log("Sent: " + name);
    } catch (err) {
        console.error("Wi-Fi Send Failed:", err);
    }
    
    // Wait 3 seconds before allowing another send to prevent spamming
    setTimeout(() => { isProcessing = false; }, 3000);
}

async function startCamera() {
    await classifier.init();
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    detectLoop();
}

async function detectLoop() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, 320, 320);
    
    // Get pixels for Edge Impulse
    const imgData = ctx.getImageData(0, 0, 320, 320).data;
    const pixels = [];
    for (let i = 0; i < imgData.length; i += 4) {
        pixels.push(imgData[i], imgData[i+1], imgData[i+2]);
    }

    // Run AI Classification
    const res = classifier.classify(pixels);
    const result = res.results.find(r => r.label === 'Manoj');

    if (result && result.value > 0.8) {
        document.getElementById('results').textContent = "Manoj Detected! Updating OLED...";
        sendToHardware("Manoj");
    } else {
        document.getElementById('results').textContent = "Scanning...";
    }

    requestAnimationFrame(detectLoop);
}

// Ensure the Start Camera button exists in your index.html
document.getElementById('start-btn').onclick = startCamera;