// --- MRTLC NEXUS v3.5: MASTER UI & ENGINE GRAPHICS CONTROLLER (INTEGRATED COMPATIBILITY BUILD) ---

// Global architecture states for structural tracking and audio scaling
let currentNexusFileStats = { scripts: 0, instances: 0, parts: 0 };
let visualizerSensitivityMultiplier = 1.0;
let currentAudioSource = null;
let audioContextInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    // Check local persistent memory for cached wallpaper string on load
    const savedWallpaper = localStorage.getItem("nexus_wallpaper");
    if (savedWallpaper) {
        document.body.style.backgroundImage = `url(${savedWallpaper})`;
    }
    
    const engineStatus = document.getElementById('engine-status');
    if(engineStatus) {
        engineStatus.style.color = "var(--accent)";
    }

    // Automate dynamic component injection to prevent index.html inflation
    injectNexusUpgradeElements();
});

/**
 * FEATURE INTERCEPT MODULE: DYNAMIC UI INJECTION
 * Automatically layers new layout tools perfectly into your existing HTML tree wrapper
 */
function injectNexusUpgradeElements() {
    // 1. Inject Node Filter Search Input directly above the Tree View container
    const treeView = document.getElementById('tree-view');
    if (treeView && !document.getElementById('nexus-node-search')) {
        const searchInput = document.createElement('input');
        searchInput.id = 'nexus-node-search';
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 FILTER WORKSPACE TREE NODES...';
        searchInput.style = 'width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); padding: 8px 12px; border-radius: 6px; color: var(--accent); font-family: monospace; font-size: 11px; margin-bottom: 8px; box-sizing: border-box; outline: none;';
        searchInput.oninput = (e) => filterNexusTreeNodes(e.target.value);
        treeView.parentNode.insertBefore(searchInput, treeView);
    }

    // 2. Inject Roblox Quick Stats Metric Grid directly below the Main Compile Button
    const compileBtn = document.getElementById('main-compile-btn');
    if (compileBtn && !document.getElementById('nexus-stats-panel')) {
        const statsPanel = document.createElement('div');
        statsPanel.id = 'nexus-stats-panel';
        statsPanel.style = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 12px;';
        statsPanel.innerHTML = `
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border); padding: 8px 4px; border-radius: 6px; text-align: center; font-family: monospace; font-size: 10px;">
                <div style="color: var(--text-muted); margin-bottom: 2px;">SCRIPTS</div><div id="stat-count-scripts" style="color: var(--accent); font-weight: bold; font-size: 12px;">0</div>
            </div>
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border); padding: 8px 4px; border-radius: 6px; text-align: center; font-family: monospace; font-size: 10px;">
                <div style="color: var(--text-muted); margin-bottom: 2px;">PARTS</div><div id="stat-count-parts" style="color: var(--neon-green); font-weight: bold; font-size: 12px;">0</div>
            </div>
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--glass-border); padding: 8px 4px; border-radius: 6px; text-align: center; font-family: monospace; font-size: 10px;">
                <div style="color: var(--text-muted); margin-bottom: 2px;">TOTAL INST</div><div id="stat-count-total" style="color: #ffaa00; font-weight: bold; font-size: 12px;">0</div>
            </div>
        `;
        compileBtn.parentNode.insertBefore(statsPanel, compileBtn.nextSibling);
    }

    // 3. Inject Wave Gain Range Controller Slider directly beneath the Audio Visualizer Canvas
    const canvas = document.getElementById('visualizer-canvas');
    if (canvas && !document.getElementById('nexus-sensitivity-wrapper')) {
        const sliderWrapper = document.createElement('div');
        sliderWrapper.id = 'nexus-sensitivity-wrapper';
        sliderWrapper.style = 'margin-top: 12px; background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); padding: 10px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px;';
        sliderWrapper.innerHTML = `
            <span style="font-family: monospace; font-size: 10px; color: var(--text-muted); white-space: nowrap;">🎛️ WAVE GAIN:</span>
            <input type="range" min="0.5" max="3.0" step="0.1" value="1.0" style="width: 100%; accent-color: var(--accent); cursor: pointer;" oninput="updateVisualizerSensitivity(this.value)">
            <span id="sensitivity-readout" style="font-family: monospace; font-size: 10px; color: var(--accent); min-width: 25px; text-align: right;">1.0x</span>
        `;
        canvas.parentNode.insertBefore(sliderWrapper, canvas.nextSibling);
    }
}

/**
 * UPGRADE FEATURE 1: TREE FILTER SEARCH
 * Iterates through active tree views, matching queries and auto-collapsing unmatched paths
 */
function filterNexusTreeNodes(query) {
    const cleanQuery = query.toLowerCase().trim();
    const treeView = document.getElementById('tree-view');
    if (!treeView) return;

    const nodes = treeView.querySelectorAll('.tree-node, div, span');
    nodes.forEach(node => {
        if (node.children.length > 0 && node.tagName !== 'SPAN') return; 
        const text = node.textContent.toLowerCase();
        if (text.includes(cleanQuery)) {
            node.style.display = '';
            let parent = node.parentElement;
            while (parent && parent !== treeView) {
                parent.style.display = '';
                parent = parent.parentElement;
            }
        } else {
            node.style.display = 'none';
        }
    });
}

/**
 * UPGRADE FEATURE 2: METRICS PIPELINE HOOK
 * Call this function inside your 'nexus-parser.js' decompiler loops to route counts into the UI!
 */
function updateNexusWorkspaceStats(scripts, parts, total) {
    currentNexusFileStats = { scripts, instances: total, parts };
    if(document.getElementById('stat-count-scripts')) {
        document.getElementById('stat-count-scripts').innerText = scripts;
        document.getElementById('stat-count-parts').innerText = parts;
        document.getElementById('stat-count-total').innerText = total;
    }
}

/**
 * UPGRADE FEATURE 3: AUDIO GAIN AMPLIFIER ADJUSTMENT
 */
function updateVisualizerSensitivity(val) {
    visualizerSensitivityMultiplier = parseFloat(val);
    document.getElementById('sensitivity-readout').innerText = `${visualizerSensitivityMultiplier.toFixed(1)}x`;
}

/**
 * CORE MODULE: TAB ROUTING PANEL CONTROLLER
 */
function switchNexusTab(targetTab) {
    const tabs = ['parser', 'visualizer', 'settings'];
    tabs.forEach(t => {
        const view = document.getElementById(`nexus-${t}-view`);
        const btn = document.getElementById(`tab-${t}-btn`);
        if (view) view.style.display = (t === targetTab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === targetTab);
    });
}

/**
 * CORE MODULE: DESIGN VARIABLE VAR PRESET STYLES
 */
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

/**
 * CORE MODULE: SYSTEM PERSISTENT BASE64 WALLPAPER STORAGE
 */
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

/**
 * CORE MODULE: MOBILE-COMPATIBLE WAVEFORM AUDIO VISUALIZER ENGINE
 */
async function processAudioSelection(input) {
    const file = input.files[0];
    if (!file) return;

    // Reset previous hardware context streams to avoid engine overlaps
    if (currentAudioSource) { try { currentAudioSource.stop(); } catch(e){} }

    const statusBox = document.getElementById('audio-status-box');
    statusBox.innerText = `STREAMING: [${file.name.toUpperCase()}]`;
    statusBox.style.display = 'block';

    document.getElementById('engine-status').innerText = "AUDIO FEED";
    document.getElementById('engine-status').style.color = "var(--neon-purple)";

    // Instantiate hardware pipeline audio mapping
    audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    const canvas = document.getElementById('visualizer-canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale canvas dimensions safely to accommodate high-DPI retina mobile resolutions
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const bufferArray = e.target.result;
        
        // Force AudioContext deployment out of background sleep mode (Critical mobile override)
        if (audioContextInstance.state === 'suspended') {
            await audioContextInstance.resume();
        }

        const decodedAudio = await audioContextInstance.decodeAudioData(bufferArray);
        
        currentAudioSource = audioContextInstance.createBufferSource();
        currentAudioSource.buffer = decodedAudio;
        
        const analyserNode = audioContextInstance.createAnalyser();
        analyserNode.fftSize = 64; // Smaller size for rapid response frequency readings on mobile devices
        analyserNode.smoothingTimeConstant = 0.8;
        
        // 🔒 MOBILE HARWARE CONNECTION PIPELINE CHAIN: Source -> Analyzer -> Speakers
        currentAudioSource.connect(analyserNode);
        analyserNode.connect(audioContextInstance.destination);
        currentAudioSource.start(0);

        const dataLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(dataLength);

        const viewWidth = canvas.width / window.devicePixelRatio;
        const viewHeight = canvas.height / window.devicePixelRatio;
        const barWidth = (viewWidth / dataLength) * 0.8;

        function drawLiquidLoop() {
            requestAnimationFrame(drawLiquidLoop);
            analyserNode.getByteFrequencyData(dataArray);

            // Establish fluid motion trail background repaint
            ctx.fillStyle = 'rgba(4, 4, 6, 0.25)';
            ctx.fillRect(0, 0, viewWidth, viewHeight);

            // Draw center alignment axis line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, viewHeight * 0.65);
            ctx.lineTo(viewWidth, viewHeight * 0.65);
            ctx.stroke();

            let hasSignal = false;

            for (let i = 0; i < dataLength; i++) {
                let rawValue = dataArray[i];
                if (rawValue > 0) hasSignal = true;

                let percentValue = rawValue / 255;
                let maxBarHeight = viewHeight * 0.55;
                
                // Sensitivity Multiplier calculation integration factor
                let barHeight = percentValue * maxBarHeight * visualizerSensitivityMultiplier;

                if(barHeight > viewHeight * 0.63) barHeight = viewHeight * 0.63; // Clip prevention guard

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

                    // Generate inverse glass liquid reflections below baseline
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

            // Diagnostic Standby Wave: Creates a tiny idle trace if the file is rendering silent frequencies
            if (!hasSignal) {
                const idleTime = Date.now() * 0.004;
                ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
                ctx.fillRect(10 + Math.sin(idleTime)*5, viewHeight * 0.64, viewWidth - 20, 2);
            }
        }
        drawLiquidLoop();
    };
    reader.readAsArrayBuffer(file);
}

// Global text buffer tracker for clipboard operations
let currentConsoleBufferText = ""; 
function copyConsoleBuffer() {
    const outputBox = document.getElementById('code-preview-box');
    if(!outputBox) return;
    const textToCopy = outputBox.value || currentConsoleBufferText;
    navigator.clipboard.writeText(textToCopy);
    alert("📋 Raw text chunk successfully copied to system clipboard frame!");
        }
