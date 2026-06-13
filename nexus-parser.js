// nexus-parser.js - Secure UI Engine with Visual Diagnostics

const compileBtn = document.getElementById('main-compile-btn');
const fileInput = document.getElementById('file-input');
const treeView = document.getElementById('tree-view');
const codePreviewBox = document.getElementById('code-preview-box');

let nexusWorker = new Worker('nexus-worker.js', { type: 'module' });
let compilationTimeout = null;

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

window.executeNexusCompilation = async function() {
    const file = fileInput.files[0];
    if (!file) {
        alert("Select an active structural file stream first.");
        return;
    }

    compileBtn.innerText = "PROCESSING CHUNKS...";
    compileBtn.setAttribute('disabled', 'true');
    
    if (treeView) treeView.innerHTML = `<span style="color: #00ff00;">[STATUS] Extracting payload buffer stream...</span>`;
    if (codePreviewBox) codePreviewBox.value = "";

    clearTimeout(compilationTimeout);

    compilationTimeout = setTimeout(() => {
        console.warn("[MRTLC WATCHDOG] Task forcefully terminated.");
        nexusWorker.terminate();
        nexusWorker = new Worker('nexus-worker.js', { type: 'module' });
        setupWorkerListener(); 
        
        if (treeView) {
            treeView.innerHTML = `<span style="color: #ffaa00;">[TIMEOUT] Halted to prevent local terminal crash.</span>`;
        }
        resetButton();
    }, 10000);

    try {
        const arrayBuffer = await file.arrayBuffer();
        nexusWorker.postMessage(arrayBuffer, [arrayBuffer]);
    } catch (err) {
        console.error("Payload read failure:", err);
        clearTimeout(compilationTimeout);
        resetButton();
    }
};

function setupWorkerListener() {
    nexusWorker.onmessage = (event) => {
        clearTimeout(compilationTimeout);
        resetButton();

        const { success, isXml, xmlData, data, error } = event.data;

        if (!success) {
            if (treeView) treeView.innerHTML = `<span style="color: #ff3333;">[FAULT] ${error}</span>`;
            return;
        }

        if (treeView) treeView.innerHTML = ''; 

        if (isXml) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, "text/xml");
            const rootItems = xmlDoc.querySelectorAll("roblox > Item");
            
            if (rootItems.length === 0) {
                treeView.innerHTML = `<span style="color: #ffaa00;">[WARN] XML Workspace data structure appears empty.</span>`;
                return;
            }

            const parsedTree = parseXmlNodes(rootItems);
            renderNexusTree(parsedTree, treeView);
        } 
        else if (data) {
            // Check if the worker only returned system warnings or empty arrays
            const hasValidScripts = data[0] && data[0].Children && data[0].Children.length > 0 && data[0].Children[0].Name !== "System_Notification";
            
            if (!hasValidScripts) {
                if (treeView) {
                    treeView.innerHTML = `
                        <div style="padding: 10px; border: 1px solid #ffaa00; background: #221100; color: #ffaa00; border-radius: 4px; font-size: 13px;">
                            <strong style="color: #ffffff;">[MRTLC NEXUS SYSTEM DIAGNOSTIC]</strong><br><br>
                            The uploaded <strong>.rbxm</strong> binary blocks are packed using modern Roblox LZ4 chunk compression. 
                            The source string characters cannot be extracted in pure browser memory streams while compressed.<br><br>
                            <span style="color: #00ffd0;">✔ QUICK FIX:</span> In Roblox Studio, right-click your Model/Script and select <strong>Save to File</strong>, then switch the file type dropdown from Binary (.rbxm) to <strong style="color: #ffffff;">Roblox XML Model Files (*.rbxmx)</strong>.<br><br>
                            Drop that generated XML file back into MRTLC Nexus and it will decompress your code layout instantly!
                        </div>
                    `;
                }
                if (codePreviewBox) {
                    codePreviewBox.value = `-- MRTLC Nexus Diagnostic Trace\n-- Status: Payload buffer read cleanly but data stream is encrypted/compressed.\n-- Recommendation: Swap to .rbxmx format in Studio for mobile execution compatibility.`;
                }
                return;
            }
            renderNexusTree(data, treeView);
        }
    };

    nexusWorker.onerror = (err) => {
        clearTimeout(compilationTimeout);
        resetButton();
    };
}

setupWorkerListener();

function parseXmlNodes(xmlNodeList) {
    const instances = [];
    xmlNodeList.forEach(node => {
        if (node.nodeType !== 1) return;
        const className = node.getAttribute("class") || "Instance";
        const nameNode = node.querySelector(":scope > Properties > string[name='Name']");
        const name = nameNode ? nameNode.textContent : className;
        const sourceNode = node.querySelector(":scope > Properties > protectedstring[name='Source']");
        const sourceCode = sourceNode ? sourceNode.textContent : null;

        const currentInstance = {
            ClassName: className,
            Name: name,
            Source: sourceCode,
            Children: []
        };

        const childNodes = node.querySelectorAll(":scope > Item");
        if (childNodes.length > 0) {
            currentInstance.Children = parseXmlNodes(childNodes);
        }
        instances.push(currentInstance);
    });
    return instances;
}

function renderNexusTree(instances, container) {
    instances.forEach(ins => {
        if (!ins) return;
        const itemElement = document.createElement('div');
        itemElement.style.paddingLeft = "14px";
        itemElement.style.margin = "4px 0";
        itemElement.style.cursor = "pointer";
        itemElement.style.fontSize = "13px";

        const className = ins.ClassName || 'Instance';
        const isScript = className.includes('Script') || className === 'ModuleScript';
        const nameColor = isScript ? '#4fc1ff' : '#00ffd0';

        itemElement.innerHTML = `<span style="color: ${nameColor}; font-weight: bold;">[${className}]</span> <span style="color: #ffffff;">${ins.Name || 'Instance'}</span>`;

        itemElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!codePreviewBox) return;
            const sourceCode = ins.Source;
            if (sourceCode !== null && sourceCode !== undefined) {
                codePreviewBox.value = `-- EXECUTING SOURCE TRACE MAP: ${ins.Name || 'Script'}\n------------------------------------------------\n\n${sourceCode}`;
            } else {
                codePreviewBox.value = `-- INSTANCE TRACE: ${ins.Name || 'Instance'}\n-- No embedded source found in this layout container block.`;
            }
        });

        container.appendChild(itemElement);

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
