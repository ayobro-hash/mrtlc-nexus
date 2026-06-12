// --- MRTLC NEXUS MODULE: UI & AUDIO ENGINE ---
let uploadedBlob = null;
let generatedLuauCode = "";
let baseFileName = "mrtlc_nexus";
let currentAudioSource = null;
let audioContextInstance = null;

// TAB CONFIGURATION DISPATCHER
function switchNexusTab(targetTab) {
    const parserView = document.getElementById('nexus-parser-view');
    const visualizerView = document.getElementById('nexus-visualizer-view');
    const parserBtn = document.getElementById('tab-parser-btn');
    const visualizerBtn = document.getElementById('tab-visualizer-btn');

    if (targetTab === 'parser') {
        parserView.style.display = 'block';
        visualizerView.style.display = 'none';
        parserBtn.classList.add('active');
        visualizerBtn.classList.remove('active');
    } else {
        parserView.style.display = 'none';
        visualizerView.style.display = 'block';
        parserBtn.classList.remove('active');
        visualizerBtn.classList.add('active');
    }
}

// --- MUSIC VISUALIZER ENGINE MODULE ---
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
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const bufferArray = e.target.result;
        const decodedAudio = await audioContextInstance.decodeAudioData(bufferArray);
        
        currentAudioSource = audioContextInstance.createBufferSource();
        currentAudioSource.buffer = decodedAudio;
        
        const analyserNode = audioContextInstance.createAnalyser();
        analyserNode.fftSize = 256;
        
        currentAudioSource.connect(analyserNode);
        analyserNode.connect(audioContextInstance.destination);
        currentAudioSource.start(0);

        const dataLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(dataLength);
        const barWidth = (canvas.width / dataLength) * 1.4;

        function renderLoop() {
            requestAnimationFrame(renderLoop);
            analyserNode.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#050508';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < dataLength; i++) {
                let percentValue = dataArray[i] / 255;
                let barHeight = percentValue * canvas.height * 0.85;

                let r = Math.floor(0 + (percentValue * 189));
                let g = Math.floor(240 - (percentValue * 240));
                let b = 255;

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.shadowBlur = 4;
                ctx.shadowColor = "rgba(0, 240, 255, 0.5)";

                ctx.fillRect(i * (barWidth + 2), canvas.height - barHeight - 10, barWidth, barHeight);
            }
        }
        renderLoop();
    };
    reader.readAsArrayBuffer(file);
}
