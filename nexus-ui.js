// --- MRTLC NEXUS v3.5: MASTER UI & ENGINE GRAPHICS CONTROLLER (REMAKE BUILD) ---

// Global architecture states for structural tracking and audio analytics
let currentNexusFileStats = { scripts: 0, instances: 0, parts: 0 };
let visualizerSensitivityMultiplier = 1.0;

// Re-engineered HTML5 Audio Pipeline states to guarantee canvas frequency capture
let audioContextInstance = null;
let analyserNode = null;
let sourceNode = null;
let audioTagInstance = null; // Underlying hardware routing tag
let isVisualizerLoopRunning = false;

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

    // Automate injection of search bar, statistics grid, and gain engine components
    injectNexusUpgradeElements();
    
    // Initialize a hidden audio element to anchor stable browser decoding streams
    initHiddenAudioPipeline();
});

/**
 * CORE GENERATOR: DYNAMIC DOM INJECTION
 * Safely inserts the interactive modules without altering your index.html core
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
            <input type="range" min="0.5" max="4.0" step="0.1" value="1.0" style="width: 100%; accent-color: var(--accent); cursor: pointer;" oninput="updateVisualizerSensitivity(this.value)">
            <span id="sensitivity-readout" style="font-family: monospace; font-size: 10px; color: var(--accent); min-width: 25px; text-align: right;">1.0x</span>
        `;
        canvas.parentNode.insertBefore(sliderWrapper, canvas.nextSibling);
    }
}

/**
 * UPGRADE MODULE 1: INTERACTIVE EXPLORER FILTER
 * Loops across standard tree elements or text rows, stripping unselected classes
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
 * UPGRADE MODULE 2: WORKSPACE COMPILATION STATS ENTRY HOOK
 * Fire this explicitly from nexus-parser.js to sync files with the readout panels
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
 * UPGRADE MODULE 3: SENSITIVITY MULTIPLIER REGULATOR
 */
function updateVisualizerSensitivity(val) {
    visualizerSensitivityMultiplier = parseFloat(val);
    document.getElementById('sensitivity-readout').innerText = `${visualizerSensitivityMultiplier.toFixed(1)}x`;
}

/**
 * CORE MODULE: TAB LAYOUT TOGGLE ENGINE
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
 * CORE MODULE: THEME CSS VARIABLE GENERATOR
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
 * CORE MODULE: BACKGROUND IMAGING SYSTEM (BASE64 LOCALSTORAGE)
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
 * ULTIMATE RE-ENGINEERED SOUND HARNESS LAYER
 * Resolves flatlining by mounting a true HTML5 track element rather than data array snapshots
 */
function initHiddenAudioPipeline() {
    if (document.getElementById('nexus-core-audio-element')) return;
    
    audioTagInstance = document.createElement('audio');
    audioTagInstance.id = 'nexus-core-audio-element';
    audioTagInstance.crossOrigin = "anonymous";
    audioTagInstance.style.display = "none";
    document.body.appendChild(audioTagInstance);
}

async function processAudioSelection(input) {
    const file = input.files[0];
    if (!file) return;

    const statusBox = document.getElementById('audio-status-box');
    statusBox.innerText = `LOADING MATRIX STREAM...`;
    statusBox.style.display = 'block';

    // Build the cross-platform Context directly under the pointer gesture thread
    if (!audioContextInstance) {
        audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioContextInstance.state === 'suspended') {
        await audioContextInstance.resume();
    }

    // Connect node routes only once to avoid duplicate hardware graph allocations
    if (!analyserNode) {
        analyserNode = audioContextInstance.createAnalyser();
        analyserNode.fftSize = 64; // Low bucket optimization for crystal-clear response on mobile views
        analyserNode.smoothingTimeConstant = 0.75;
        
        sourceNode = audioContextInstance.createMediaElementSource(audioTagInstance);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioContextInstance.destination);
    }

    // Convert raw media file chunk into a secure blob link string
    const objectUrl = URL.createObjectURL(file);
    audioTagInstance.src = objectUrl;
    
    // Fire the hardware engine play routine
    audioTagInstance.play().then(() => {
        statusBox.innerText = `STREAMING: [${file.name.toUpperCase()}]`;
        document.getElementById('engine-status').innerText = "AUDIO FEED";
        document.getElementById('engine-status').style.color = "var(--neon-purple)";
        
        // Launch rendering engine loops if currently idling
        if (!isVisualizerLoopRunning) {
            isVisualizerLoopRunning = true;
            beginCanvasRenderMatrix();
        }
    }).catch(err => {
        console.error("Media Routing Fault:", err);
        statusBox.innerText = "ERR: INTERACTION AUDIO BLOCKED";
    });
}

function beginCanvasRenderMatrix() {
    const canvas = document.getElementById('visualizer-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Handle Retina screen rendering ratios safely
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const dataLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(dataLength);

    const viewWidth = canvas.width / window.devicePixelRatio;
    const viewHeight = canvas.height / window.devicePixelRatio;
    const barWidth = (viewWidth / dataLength) * 0.82;

    function renderFrameLoop() {
        requestAnimationFrame(renderFrameLoop);
        
        // Feed frequency registers directly into data map array
        analyserNode.getByteFrequencyData(dataArray);

        // Neon trace background trailing clear
        ctx.fillStyle = 'rgba(4, 4, 6, 0.22)';
        ctx.fillRect(0, 0, viewWidth, viewHeight);

        // Core base mirroring line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, viewHeight * 0.65);
        ctx.lineTo(viewWidth, viewHeight * 0.65);
        ctx.stroke();

        let activeSignalDetected = false;

        for (let i = 0; i < dataLength; i++) {
            let valueByte = dataArray[i];
            if (valueByte > 4) activeSignalDetected = true;

            let scalarRatio = valueByte / 255;
            let allocationLimit = viewHeight * 0.55;
            
            // Core upgrade connection: Calculate bar depth via slider modifier parameter
            let barHeight = scalarRatio * allocationLimit * visualizerSensitivityMultiplier;

            if (barHeight > viewHeight * 0.62) barHeight = viewHeight * 0.62; // Envelope safety layout guard

            let xPos = i * (viewWidth / dataLength) + (viewWidth / dataLength - barWidth) / 2;
            let yPos = (viewHeight * 0.65) - barHeight;

            if (barHeight > 0) {
                ctx.save();
                
                let liquidGradient = ctx.createLinearGradient(xPos, yPos, xPos, viewHeight * 0.65);
                liquidGradient.addColorStop(0, 'var(--accent)');
                liquidGradient.addColorStop(1, 'rgba(189, 0, 255, 0.2)');

                ctx.fillStyle = liquidGradient;
                ctx.shadowBlur = 14;
                ctx.shadowColor = 'var(--accent)';
                
                ctx.beginPath();
                ctx.roundRect(xPos, yPos, barWidth, barHeight, [4, 4, 0, 0]);
                ctx.fill();

                // Downward inverted liquid glass reflections
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

        // Diagnostics Standby line tracker: creates fluid motion if track contains low frequency signals
        if (!activeSignalDetected) {
            const idleTime = Date.now() * 0.004;
            ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.fillRect(10 + Math.sin(idleTime) * 5, viewHeight * 0.64, viewWidth - 20, 2);
        }
    }
    
    renderFrameLoop();
}

// Global text string data layout storage to back up copy actions
let currentConsoleBufferText = ""; 
function copyConsoleBuffer() {
    const outputBox = document.getElementById('code-preview-box');
    if(!outputBox) return;
    const textToCopy = outputBox.value || currentConsoleBufferText;
    navigator.clipboard.writeText(textToCopy);
    alert("📋 Raw text chunk successfully copied to system clipboard frame!");
                                }
