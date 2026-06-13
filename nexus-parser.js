// nexus-parser.js - MRTLC Nexus Main UI Engine

// 1. Hook up all layout components exactly by their IDs
const compileBtn = document.getElementById('main-compile-btn');
const fileInput = document.getElementById('file-input');
const treeView = document.getElementById('tree-view');
const codePreviewBox = document.getElementById('code-preview-box');

// 2. Spawn the background thread matrix 
let nexusWorker = new Worker('nexus-worker.js', { type: 'module' });
let compilationTimeout = null;

// 3. Keep compiled button locked down securely until a file stream is loaded
if (fileInput) {
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            compileBtn.removeAttribute('disabled');
            compileBtn.style.opacity = "1";
            compileBtn.style.cursor = "pointer";
        } else {
            compileBtn.setAttribute('disabled', 'true');
            compileBtn.style.opacity = "0.5";
        }
    });
}

// 4. Global Action Trigger for index.html (onclick="executeNexusCompilation()")
window.executeNexusCompilation = async function() {
    const file = fileInput.files[0];
    if (!file) {
        alert("Select an active structural file stream first.");
        return;
    }

    // Toggle compilation states
    compileBtn.innerText = "PROCESSING CHUNKS...";
    compileBtn.setAttribute('disabled', 'true');
    
    if (treeView) treeView.innerHTML = `<span style="color: #00ff00;">[STATUS] Extracting payload buffer stream...</span>`;
    if (codePreviewBox) codePreviewBox.value = "";

    // Clear any active leftover timers
    clearTimeout(compilationTimeout);

    // WATCHDOG TIMER: If the parser library gets stuck in an infinite loop, abort!
    compilationTimeout = setTimeout(() => {
        console.warn("[MRTLC WATCHDOG] Compilation took too long. Task forcefully aborted.");
        
        // Kill the frozen thread instantly
        nexusWorker.terminate();
        
        // Respawn a fresh thread immediately so the interface doesn't stay broken
        nexusWorker = new Worker('nexus-worker.js', { type: 'module' });
        setupWorkerListener(); 
        
        if (treeView) {
            treeView.innerHTML = `<span style="color: #ffaa00;">[TIMEOUT DEADLOCK] Binary decoding halted. This model uses modern Roblox formatting properties that the 2023 rbxBinaryParser loop cannot decompress synchronously.</span>`;
        }
        resetButton();
    }, 10000); // 10-second limit

    try {
        // Read raw file bytes
        const arrayBuffer = await file.arrayBuffer();

        // Pass memory block directly to the background worker
        nexusWorker.postMessage(arrayBuffer, [arrayBuffer]);
    } catch (err) {
        console.error("Payload read failure:", err);
        clearTimeout(compilationTimeout);
        resetButton();
    }
};

// 5. Encapsulate Worker Messengers so they can be re-bound during an execution reset
function setupWorkerListener() {
    nexusWorker.onmessage = (event) => {
        // Break the watchdog lock immediately since it responded
        clearTimeout(compilationTimeout);
        resetButton();

        const { success, data, error } = event.data;

        if (success) {
            console.log("MRTLC Nexus array verified:", data);
            
            if (treeView) {
                treeView.innerHTML = ''; // Wipe out the initial "Awaiting data" messages
                
                // Render out the nested layout structure
                if (Array.isArray(data)) {
                    renderNexusTree(data, treeView);
                } else {
                    renderNexusTree([data], treeView);
                }
            }
        } else {
            console.error("Parser Engine Crash:", error);
            if (treeView) {
                treeView.innerHTML = `<span style="color: #ff3333;">[CRITICAL FAULT] ${error}</span>`;
            }
        }
    };

    nexusWorker.onerror = (err) => {
        clearTimeout(compilationTimeout);
        console.error("Worker Global Error:", err);
        resetButton();
    };
}

// Fire up the initial listener mapping
setupWorkerListener();

// 6. Interactive Element Multi-Tree Renderer 
function renderNexusTree(instances, container) {
    instances.forEach(ins => {
        if (!ins) return;

        // Construct interactive tree node row
        const itemElement = document.createElement('div');
        itemElement.style.paddingLeft = "14px";
        itemElement.style.margin = "3px 0";
        itemElement.style.cursor = "pointer";
        itemElement.style.fontSize = "13px";

        // Separate script elements visually from structural components
        const className = ins.ClassName || 'Instance';
        const isScript = className.includes('Script') || className === 'ModuleScript';
        const nameColor = isScript ? '#4fc1ff' : '#00ffd0';

        itemElement.innerHTML = `<span style="color: ${nameColor}; font-weight: bold;">[${className}]</span> <span style="color: #ffffff;">${ins.Name || 'Instance'}</span>`;

        // Interactive mouse click to pull source traces out of the instance properties matrix
        itemElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Block bubbling so parent groups don't open simultaneously
            
            if (!codePreviewBox) return;

            let sourceCode = null;
            // Scan for the exact property paths used by rbxBinaryParser
            if (ins.properties && ins.properties.Source) {
                sourceCode = ins.properties.Source.value;
            } else if (ins.Source) {
                sourceCode = ins.Source;
            }

            if (sourceCode !== null && sourceCode !== undefined) {
                codePreviewBox.value = `-- EXECUTING SOURCE TRACE MAP: ${ins.Name || 'Script'}\n-- Class Type: ${className}\n------------------------------------------------\n\n${sourceCode}`;
            } else {
                codePreviewBox.value = `-- INSTANCE TRACE: ${ins.Name || 'Instance'}\n-- Class Type: ${className}\n-- Notification: No embedded script strings found inside this specific component structure block.`;
            }
        });

        container.appendChild(itemElement);

        // Walk recursively into deeply nested child layers
        if (ins.Children && ins.Children.length > 0) {
            const nestedContainer = document.createElement('div');
            nestedContainer.style.borderLeft = "1px dashed #444444";
            nestedContainer.style.marginLeft = "6px";
            nestedContainer.style.paddingLeft = "6px";
            
            itemElement.appendChild(nestedContainer);
            renderNexusTree(ins.Children, nestedContainer);
        }
    });
}

function resetButton() {
    if (compileBtn) {
        compileBtn.innerText = "COMPILE SOURCE CHUNKS";
        compileBtn.removeAttribute('disabled');
    }
}
