// nexus-parser.js - Main UI Processing Thread

// 1. Core DOM Elements
const compileBtn = document.getElementById('main-compile-btn');
const fileInput = document.getElementById('file-input');
const treeView = document.getElementById('tree-view');
const codePreviewBox = document.getElementById('code-preview-box');

// 2. Initialize Background Processing Thread
const nexusWorker = new Worker('nexus-worker.js', { type: 'module' });

// 3. Keep compiled button disabled safely until payload is present
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

    try {
        // Read raw data stream
        const arrayBuffer = await file.arrayBuffer();

        // Pass buffer memory instantly over the thread wall
        nexusWorker.postMessage(arrayBuffer, [arrayBuffer]);
    } catch (err) {
        console.error("Payload read failure:", err);
        if (treeView) treeView.innerHTML = `<span style="color: #ff3333;">[ERROR] Failed to read file bytes.</span>`;
        resetButton();
    }
};

// 5. Catch decompressed outputs coming from nexus-worker.js
nexusWorker.onmessage = (event) => {
    resetButton();

    const { success, data, error } = event.data;

    if (success) {
        console.log("Nexus compilation array verified:", data);
        
        if (treeView) {
            treeView.innerHTML = ''; // Clear out loading markers
            
            // Render the root hierarchy array loops
            if (Array.isArray(data)) {
                renderNexusTree(data, treeView);
            } else {
                renderNexusTree([data], treeView);
            }
        }
    } else {
        console.error("Nexus worker parsing drop trace crash:", error);
        if (treeView) {
            treeView.innerHTML = `<span style="color: #ff3333;">[CRITICAL STACK FAULT] ${error}</span>`;
        }
    }
};

// 6. Interactive Element Multi-Tree Renderer 
function renderNexusTree(instances, container) {
    instances.forEach(ins => {
        if (!ins) return;

        // Construct node item structure
        const itemElement = document.createElement('div');
        itemElement.className = 'tree-item';
        itemElement.style.paddingLeft = "14px";
        itemElement.style.margin = "2px 0";
        itemElement.style.cursor = "pointer";
        itemElement.style.fontSize = "13px";

        // Style scripts distinctly from parts/models
        const className = ins.ClassName || 'Instance';
        const isScript = className.includes('Script') || className === 'ModuleScript';
        const nameColor = isScript ? '#4fc1ff' : '#00ffd0';

        itemElement.innerHTML = `<span style="color: ${nameColor}; font-weight: bold;">[${className}]</span> <span style="color: #ffffff;">${ins.Name || 'Instance'}</span>`;

        // Interactive click event to capture script content
        itemElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent parent blocks from capturing bubble triggers
            
            if (!codePreviewBox) return;

            // Extract source data safely following rbxBinaryParser nested property patterns
            let sourceCode = null;
            if (ins.properties && ins.properties.Source) {
                sourceCode = ins.properties.Source.value;
            } else if (ins.Source) {
                sourceCode = ins.Source;
            }

            if (sourceCode !== null && sourceCode !== undefined) {
                codePreviewBox.value = `-- EXECUTING SOURCE TRACE MAP: ${ins.Name || 'Script'}\n-- Class: ${className}\n------------------------------------------------\n\n${sourceCode}`;
            } else {
                codePreviewBox.value = `-- INSTANCE TRACE: ${ins.Name || 'Instance'}\n-- Class Type: ${className}\n-- System Notification: No embedded source code string located within this instance block.`;
            }
        });

        container.appendChild(itemElement);

        // Recursively walk into deeply nested child elements
        if (ins.Children && ins.Children.length > 0) {
            const nestedContainer = document.createElement('div');
            nestedContainer.style.borderLeft = "1px solid #333333";
            nestedContainer.style.marginLeft = "6px";
            nestedContainer.style.paddingLeft = "4px";
            
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
