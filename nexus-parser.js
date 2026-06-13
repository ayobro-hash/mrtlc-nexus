// nexus-parser.js - Modern Unified UI Engine for MRTLC Nexus

// 1. Map core layout elements securely by their explicit HTML IDs
const compileBtn = document.getElementById('main-compile-btn');
const fileInput = document.getElementById('file-input');
const treeView = document.getElementById('tree-view');
const codePreviewBox = document.getElementById('code-preview-box');

// 2. Initialize background thread environment matrix
let nexusWorker = new Worker('nexus-worker.js', { type: 'module' });
let compilationTimeout = null;

// 3. Keep compile buttons securely locked until a valid target payload is staged
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

// 4. Main Event Execution Trigger called directly from index.html (onclick)
window.executeNexusCompilation = async function() {
    const file = fileInput.files[0];
    if (!file) {
        alert("Select an active structural file stream first.");
        return;
    }

    // Shift interface layout states to processing mode
    compileBtn.innerText = "PROCESSING CHUNKS...";
    compileBtn.setAttribute('disabled', 'true');
    
    if (treeView) treeView.innerHTML = `<span style="color: #00ff00;">[STATUS] Extracting payload buffer stream...</span>`;
    if (codePreviewBox) codePreviewBox.value = "";

    // Clear any dangling timeout checks from previous runs
    clearTimeout(compilationTimeout);

    // 10-Second Watchdog Timer: Protects UI thread availability against corrupt/malformed blocks
    compilationTimeout = setTimeout(() => {
        console.warn("[MRTLC WATCHDOG] Compilation limit reached. Aborting stuck process thread.");
        
        nexusWorker.terminate();
        
        // Instantly spawn a fresh worker matrix so the interface remains completely usable
        nexusWorker = new Worker('nexus-worker.js', { type: 'module' });
        setupWorkerListener(); 
        
        if (treeView) {
            treeView.innerHTML = `<span style="color: #ffaa00;">[TIMEOUT TERMINATION] Compilation execution took too long. The file data format layout may be corrupt or unstable.</span>`;
        }
        resetButton();
    }, 10000);

    try {
        // Read raw file stream bits natively
        const arrayBuffer = await file.arrayBuffer();

        // Ship the memory block array directly down the background worker pipe
        nexusWorker.postMessage(arrayBuffer, [arrayBuffer]);
    } catch (err) {
        console.error("Payload read failure:", err);
        clearTimeout(compilationTimeout);
        resetButton();
    }
};

// 5. Encapsulate Worker Message Listeners for hot-swapping resets
function setupWorkerListener() {
    nexusWorker.onmessage = (event) => {
        // Break the watchdog lock instantly since the thread responded safely
        clearTimeout(compilationTimeout);
        resetButton();

        const { success, isXml, xmlData, data, error } = event.data;

        if (!success) {
            console.error("Parser Engine Crash:", error);
            if (treeView) treeView.innerHTML = `<span style="color: #ff3333;">[CRITICAL FAULT] ${error}</span>`;
            return;
        }

        if (treeView) treeView.innerHTML = ''; // Wipe loading statuses

        // Handle XML Processing path (.rbxlx / .rbxmx)
        if (isXml) {
            console.log("[MRTLC MAIN] Parsing XML payload via native browser engine...");
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, "text/xml");
            
            // Case-Insensitive Check: Hunt down both uppercase <Item> and lowercase <item> elements
            let rootItems = xmlDoc.querySelectorAll("roblox > Item");
            if (rootItems.length === 0) {
                rootItems = xmlDoc.querySelectorAll("roblox > item");
            }
            
            if (rootItems.length === 0) {
                treeView.innerHTML = `<span style="color: #ffaa00;">[WARN] XML Workspace data structure appear empty.</span>`;
                return;
            }

            const parsedTree = parseXmlNodes(rootItems);
            renderNexusTree(parsedTree, treeView);
        } 
        // Handle Binary Processing path (.rbxm)
        else if (data) {
            // Validate if the data tree actually returned structural elements
            const hasData = data && data.length > 0 && data[0].Name !== "System_Notification";
            
            if (!hasData) {
                if (treeView) {
                    treeView.innerHTML = `
                        <div style="padding: 10px; border: 1px solid #ffaa00; background: #221100; color: #ffaa00; border-radius: 4px; font-size: 13px; line-height: 1.5;">
                            <strong style="color: #ffffff;">[MRTLC NEXUS SYSTEM DIAGNOSTIC]</strong><br><br>
                            The uploaded <strong>.rbxm</strong> binary blocks are packed using modern Roblox LZ4 chunk compression. 
                            The source string characters cannot be extracted in pure browser memory streams while compressed.<br><br>
                            <span style="color: #00ffd0;">✔ QUICK FIX:</span> In Roblox Studio, right-click your Character/Model and select <strong>Save to File</strong>, then switch the file type dropdown from Binary (.rbxm) to <strong style="color: #ffffff;">Roblox XML Model Files (*.rbxmx)</strong>.<br><br>
                            Drop that generated XML file back into MRTLC Nexus and it will decompress your workspace layout instantly!
                        </div>
                    `;
                }
                if (codePreviewBox) {
                    codePreviewBox.value = `-- MRTLC Nexus Diagnostic Trace\n-- Status: Payload buffer read cleanly but data stream is encrypted/compressed.\n-- Recommendation: Swap to .rbxmx format in Studio for mobile execution compatibility.`;
                }
                return;
            }

            console.log("[MRTLC MAIN] Rendering binary workspace view...");
            renderNexusTree(data, treeView);
        }
    };

    nexusWorker.onerror = (err) => {
        clearTimeout(compilationTimeout);
        console.error("Worker Global Core Error:", err);
        resetButton();
    };
}

// Initial binding pass for runtime execution
setupWorkerListener();

// 6. Case-Insensitive Recursive XML Node Parser Helper
function parseXmlNodes(xmlNodeList) {
    const instances = [];

    xmlNodeList.forEach(node => {
        if (node.nodeType !== 1) return; // Only process actual element blocks

        const className = node.getAttribute("class") || "Instance";
        
        // Find the Name property value inside the <Properties> tag
        const nameNode = node.querySelector(":scope > Properties > string[name='Name']");
        const name = nameNode ? nameNode.textContent : className;

        // Find the Source script content if it exists
        const sourceNode = node.querySelector(":scope > Properties > protectedstring[name='Source']");
        const sourceCode = sourceNode ? sourceNode.textContent : null;

        const currentInstance = {
            ClassName: className,
            Name: name,
            Source: sourceCode,
            Children: []
        };

        // Case-Insensitive Check: Hunt down child elements inside the structural branch safely
        let childNodes = node.querySelectorAll(":scope > Item");
        if (childNodes.length === 0) {
            childNodes = node.querySelectorAll(":scope > item");
        }

        if (childNodes.length > 0) {
            currentInstance.Children = parseXmlNodes(childNodes);
        }

        instances.push(currentInstance);
    });

    return instances;
}

// 7. Interactive Recursive DOM Explorer Node Builder
function renderNexusTree(instances, container) {
    instances.forEach(ins => {
        if (!ins) return;

        // Construct interactive container div row
        const itemElement = document.createElement('div');
        itemElement.style.paddingLeft = "14px";
        itemElement.style.margin = "4px 0";
        itemElement.style.cursor = "pointer";
        itemElement.style.fontSize = "13px";
        itemElement.style.userSelect = "none";

        const className = ins.ClassName || 'Instance';
        
        // UI Visual Distinction: Color-code script modules vs structural character objects
        const isScript = className.includes('Script') || className === 'ModuleScript';
        const nameColor = isScript ? '#4fc1ff' : '#00ffd0';

        itemElement.innerHTML = `<span style="color: ${nameColor}; font-weight: bold;">[${className}]</span> <span style="color: #ffffff;">${ins.Name || 'Instance'}</span>`;

        // Click Event: Extract raw source trace strings out of the clean instance tree properties
        itemElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Block bubbling to prevent parent tree nodes from running double traces
            
            if (!codePreviewBox) return;

            const sourceCode = ins.Source;

            if (sourceCode !== null && sourceCode !== undefined) {
                codePreviewBox.value = `-- EXECUTING SOURCE TRACE MAP: ${ins.Name || 'Script'}\n-- Class Type: ${className}\n------------------------------------------------\n\n${sourceCode}`;
            } else {
                codePreviewBox.value = `-- INSTANCE TRACE: ${ins.Name || 'Instance'}\n-- Class Type: ${className}\n-- Notification: No embedded Lua strings or script data found inside this instance layout block.`;
            }
        });

        container.appendChild(itemElement);

        // Recursively cycle into deep descendant tree levels
        if (ins.Children && ins.Children.length > 0) {
            const nestedContainer = document.createElement('div');
            nestedContainer.style.borderLeft = "1px dashed #444444";
            nestedContainer.style.marginLeft = "6px";
            nestedContainer.style.paddingLeft = "8px";
            
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
