// --- MRTLC NEXUS v4.6: SECURE TRAFFIC ROUTER & INTERFACE CONTROLLER ---

// Instantiate background worker tracking connections
const decompilerWorker = new Worker('nexus-worker.js');

/**
 * BULLETPROOF COMPILATION DISPATCHER
 */
async function executeNexusCompilation() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const reader = new FileReader();
    const previewBox = document.getElementById('code-preview-box');
    const engineStatus = document.getElementById('engine-status');

    if (previewBox) previewBox.value = "⚡ DEPLOYING MULTI-CORE BACKGROUND THREAD...";

    reader.onload = async (e) => {
        const buffer = e.target.result;
        
        // Safety Fallback Check: Force binary routing if file ends with .rbxm/.rbxl
        const fileName = file.name.toLowerCase();
        const isBinaryFile = fileName.endsWith('.rbxm') || fileName.endsWith('.rbxl');

        if (isBinaryFile) {
            console.log("MRTLC Router: Routing file buffer to nexus-worker.js");
            decompilerWorker.postMessage({ arrayBuffer: buffer });
        } else {
            console.log("MRTLC Router: Routing file buffer to XML text parser.");
            const textContent = new TextDecoder().decode(buffer);
            const finalOutput = parseXmlRobloxModel(textContent);
            if (previewBox) previewBox.value = finalOutput;
            if (engineStatus) {
                engineStatus.innerText = "SUCCESS";
                engineStatus.style.color = "var(--neon-green)";
            }
        }
    };

    // Receive data coming back out of the background worker thread file
    decompilerWorker.onmessage = function(e) {
        if (e.data.success) {
            const { extractedScripts, discoveredNames, scriptCount, partCount, instanceCount } = e.data;
            
            // Sync status boxes inside nexus-ui.js
            if (typeof updateNexusWorkspaceStats === "function") {
                updateNexusWorkspaceStats(scriptCount, partCount, instanceCount);
            }

            if (extractedScripts.length > 0) {
                previewBox.value = `-- MRTLC NEXUS NATIVE COMPILATION (.RBXM DECODED VIA WORKER)\n\n` + 
                                   extractedScripts.map((src, i) => `-- // Script Reference ID: [${discoveredNames[i] || "ModuleScript_" + (i+1)}]\n${src}`).join("\n\n");
            } else {
                // Return clear guidance instead of failing silently or showing blank screens
                previewBox.value = `-- ⚠️ DECOMPILATION NOTICE: BINARY CONTAINER DETECTED\n\n` +
                                   `The worker thread parsed this binary asset, but zero code blocks were recovered from the property arrays.\n\n` +
                                   `💡 Recommendation:\n` +
                                   `Open your file inside Roblox Studio on your PC, right-click the model, select "Save to File...", and save it as an XML format (.rbxmx) instead. Uploading the XML version will map your scripts 100% accurately on mobile viewports!`;
            }

            if (engineStatus) {
                engineStatus.innerText = "SUCCESS";
                engineStatus.style.color = "var(--neon-green)";
            }
            document.getElementById('download-btn').disabled = false;

        } else {
            previewBox.value = `❌ CORE PROCESSING REJECTION EXCEPTION:\n${e.data.error}`;
            if (engineStatus) {
                engineStatus.innerText = "FAIL";
                engineStatus.style.color = "#ff3333";
            }
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * STABLE XML MODEL TEXT SCRAPER (.RBXMX / .RBXLX)
 */
function parseXmlRobloxModel(xmlText) {
    let scriptCount = (xmlText.match(/class="[^"]*Script"/gi) || []).length;
    let partCount = (xmlText.match(/class="Part"/gi) || []).length;
    let instanceCount = (xmlText.match(/<Item/gi) || []).length;
    let extractedScripts = [];

    const sourceRegex = /<ProtectedString name="Source"><!\[CDATA\[([\s\S]*?)\]\]><\/ProtectedString>/g;
    let match;
    
    while ((match = sourceRegex.exec(xmlText)) !== null) {
        if (match[1] && match[1].trim().length > 0) {
            extractedScripts.push(match[1].trim());
        }
    }

    if (typeof updateNexusWorkspaceStats === "function") {
        updateNexusWorkspaceStats(scriptCount, partCount, instanceCount);
    }

    if (extractedScripts.length > 0) {
        return `-- MRTLC NEXUS INTEGRATED SOURCE EXTRAPOLATION (.RBXXML)\n\n` + 
               extractedScripts.map((src, i) => `-- // Decompiled Script Structure Segment [${i+1}]\n${src}`).join("\n\n");
    } else {
        return `-- ⚠️ XML Trace completed, but zero code characters were stored inside ProtectedString tags.`;
    }
}

function processFileSelection(input) {
    const file = input.files[0];
    if (!file) return;

    const statusBox = document.getElementById('file-status-box');
    if (statusBox) {
        statusBox.innerText = `MOUNTED: [${file.name.toUpperCase()}]`;
        statusBox.style.display = 'block';
    }

    const compileBtn = document.getElementById('main-compile-btn');
    if (compileBtn) compileBtn.disabled = false;
}

function triggerScriptDownload() {
    const previewBox = document.getElementById('code-preview-box');
    if (!previewBox || !previewBox.value) return;

    const fileBlob = new Blob([previewBox.value], { type: "text/plain;charset=utf-8" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(fileBlob);
    downloadLink.download = "nexus_compiled_source.lua";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
