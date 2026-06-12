// --- MRTLC NEXUS v3.5: MASTER UI & ENGINE GRAPHICS CONTROLLER ---

document.addEventListener("DOMContentLoaded", () => {
    // Check local persistent memory for cached wallpaper string on load
    const savedWallpaper = localStorage.getItem("nexus_wallpaper");
    if (savedWallpaper) {
        document.body.style.backgroundImage = `url(${savedWallpaper})`;
    }
    
    // Synchronize starting display states
    const engineStatus = document.getElementById('engine-status');
    if(engineStatus) {
        engineStatus.style.color = "var(--accent)";
    }
});

function switchNexusTab(targetTab) {
    const tabs = ['parser', 'visualizer', 'settings'];
    tabs.forEach(t => {
        const view = document.getElementById(`nexus-${t}-view`);
        const btn = document.getElementById(`tab-${t}-btn`);
        if (view) view.style.display = (t === targetTab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === targetTab);
    });
}

function applyGlassTheme(theme) {
    const root = document.documentElement;
    if (theme === 'cyber') {
        root.style.setProperty('--accent', '#00f0ff');
        root.style.setProperty('--accent-glow', 'rgba(0, 240, 255, 0.4)');
        root.style.setProperty('--glass-base', 'rgba(10, 12, 22, 0.45)');
    } else if (theme === 'matrix') {
        root.style.setProperty('--accent', '#39ff14');
        root.style.setProperty('--accent-glow', 'rgba(57, 255, 20, 0.4)');
        root.style.setProperty('--glass-base', 'rgba(6, 16, 8, 0.5)');
    } else if (theme === 'solar') {
        root.style.setProperty('--accent', '#ffaa00');
        root.style.setProperty('--accent-glow', 'rgba(255, 170, 0, 0.4)');
        root.style.setProperty('--glass-base', 'rgba(18, 12, 6, 0.5)');
    }
    document.getElementById('engine-status').style.color = "var(--accent)";
}

function processWallpaperUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        document.body.style.backgroundImage = `url(${base64Image})`;
        try {
            localStorage.setItem("nexus_wallpaper", base64Image);
        } catch(error) {
            alert("⚠️ Image file is too large for local browser memory. Try an optimized image size under 4MB.");
        }
    };
    reader.readAsDataURL(file);
}

function clearSavedWallpaper() {
    localStorage.removeItem("nexus_wallpaper");
    document.body.style.backgroundImage = `
        radial-gradient(circle at 20% 20%, rgba(0, 240, 255, 0.12), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(189, 0, 255, 0.12), transparent 40%)
    `;
}

// --- AUTOMATED LIQUID VISUALIZER INTERCEPT OVERRIDE ---
let currentAudioSource = null;
let audioContextInstance = null;

async function processAudioSelection(input) {
    const file = input.files[0];
    if (!file) return;

    if (currentAudioSource) { try { currentAudioSource.stop(); } catch(e){} }

    const statusBox = document.getElementById('audio-status-box');
    statusBox.innerText = `STREAMING: [${file.name.toUpperCase()}]`;
    statusBox.style.display = 'block';

    document.getElementById('engine-status').innerText = "AUDIO FEED";
    document.getElementById('engine-status').style.color = "var(--neon-purple)";

    audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    const canvas = document.getElementById('visualizer-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const bufferArray = e.target.result;
        const decodedAudio = await audioContextInstance.decodeAudioData(bufferArray);
        
        currentAudioSource = audioContextInstance.createBufferSource();
        currentAudioSource.buffer = decodedAudio;
        
        const analyserNode = audioContextInstance.createAnalyser();
        analyserNode.fftSize = 128;
        analyserNode.smoothingTimeConstant = 0.85;
        
        currentAudioSource.connect(analyserNode);
        analyserNode.connect(audioContextInstance.destination);
        currentAudioSource.start(0);

        const dataLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(dataLength);

        const viewWidth = canvas.width / window.devicePixelRatio;
        const viewHeight = canvas.height / window.devicePixelRatio;
        const barWidth = (viewWidth / dataLength) * 0.75;

        function drawLiquidLoop() {
            requestAnimationFrame(drawLiquidLoop);
            analyserNode.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(4, 4, 6, 0.25)';
            ctx.fillRect(0, 0, viewWidth, viewHeight);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, viewHeight * 0.65);
            ctx.lineTo(viewWidth, viewHeight * 0.65);
            ctx.stroke();

            for (let i = 0; i < dataLength; i++) {
                let percentValue = dataArray[i] / 255;
                let maxBarHeight = viewHeight * 0.55;
                let barHeight = percentValue * maxBarHeight;

                let xPos = i * (viewWidth / dataLength) + (viewWidth / dataLength - barWidth) / 2;
                let yPos = (viewHeight * 0.65) - barHeight;

                if (barHeight > 0) {
                    ctx.save();
                    
                    let liquidGradient = ctx.createLinearGradient(xPos, yPos, xPos, viewHeight * 0.65);
                    liquidGradient.addColorStop(0, 'var(--accent)');
                    liquidGradient.addColorStop(1, 'rgba(189, 0, 255, 0.2)');

                    ctx.fillStyle = liquidGradient;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = 'var(--accent)';
                    
                    ctx.beginPath();
                    ctx.roundRect(xPos, yPos, barWidth, barHeight, [4, 4, 0, 0]);
                    ctx.fill();

                    ctx.shadowBlur = 0;
                    let reflectionGradient = ctx.createLinearGradient(xPos, viewHeight * 0.65, xPos, viewHeight * 0.65 + (barHeight * 0.4));
                    reflectionGradient.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
                    reflectionGradient.addColorStop(1, 'rgba(4, 4, 6, 1)');

                    ctx.fillStyle = reflectionGradient;
                    ctx.beginPath();
                    ctx.roundRect(xPos, viewHeight * 0.65 + 2, barWidth, barHeight * 0.4, [0, 0, 4, 4]);
                    ctx.fill();

                    ctx.restore();
                }
            }
        }
        drawLiquidLoop();
    };
    reader.readAsArrayBuffer(file);
        }
