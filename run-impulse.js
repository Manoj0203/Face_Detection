let bluetoothChar;
const classifier = new EdgeImpulseClassifier();

// 1. Bluetooth Connection (Triggered by Button Click)
async function connectESP32() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'ESP32_AI_Display' }],
      optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
    bluetoothChar = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
    document.getElementById('results').textContent = "Connected to ESP32!";
  } catch (err) { console.error("Bluetooth Error:", err); }
}

// 2. Start Camera and AI Loop
async function startAttendance() {
    await classifier.init();
    const video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    
    // Start continuous detection
    detectFrame();
}

async function detectFrame() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Capture 320x320 frame for classification
    ctx.drawImage(video, 0, 0, 320, 320);
    const imgData = ctx.getImageData(0, 0, 320, 320).data;
    
    // Convert RGB pixels for Edge Impulse
    const pixels = [];
    for (let i = 0; i < imgData.length; i += 4) {
        pixels.push(imgData[i], imgData[i+1], imgData[i+2]);
    }

    const res = classifier.classify(pixels);
    
    // Find "Manoj" in results
    const manoj = res.results.find(r => r.label === 'Manoj');

    if (manoj && manoj.value > 0.8) {
        document.getElementById('results').textContent = `Manoj Detected (${(manoj.value * 100).toFixed(1)}%)`;
        
        // Automated Send via Web Bluetooth
        if (bluetoothChar) {
            let encoder = new TextEncoder();
            await bluetoothChar.writeValue(encoder.encode("Manoj"));
        }
    } else {
        document.getElementById('results').textContent = "Scanning...";
    }

    requestAnimationFrame(detectFrame); // Loop forever
}

// Add the original EdgeImpulseClassifier class you provided below...
// [Paste your existing EdgeImpulseClassifier class here]