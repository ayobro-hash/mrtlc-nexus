// --- MRTLC NEXUS v4.5: ASYNCHRONOUS INTERFACE CONTROLLER ---

// Initialize our background worker thread connection
const decompilerWorker = new Worker('nexus-worker.js');

/**
 * MASTER INTERCEPT ACTION
 * Fired when clicking your main compilation UI assets.
 */
async function executeNexusCompilation() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const reader = new FileReader();
    const previewBox = document.getElementById('code-preview-box');
    const engineStatus = document.getElementById('engine-status');

    if (previewBox) previewBox.value = "⚡ OFF-LOADING TO BACKGROUND CORE THREAD...";

    reader.onload = async (e) => {
        const buffer = e.target.result;
        const testBytes = new Uint8Array(buffer);
        const isBinary = String.fromCharCode(...testBytes.subarray(0, 6)) === "ROBLOX";

        if (isBinary) {
            // Ship the raw file arrays over to the background thread instantly!
            decompilerWorker.postMessage({ arrayBuffer: buffer });
        } else {
            // Fall back immediately to the text XML regex parser
            const textContent = new TextDecoder().decode(buffer);
            const finalOutput = parseXmlRobloxModel(textContent);
            if (previewBox) previewBox.value = finalOutput;
            if (engineStatus) {
                engineStatus.innerText = "SUCCESS";
                engineStatus.style.color = "var(--neon-green)";
            }
        }
    };

    // Listen for incoming answers returning from the background worker file
    decompilerWorker.onmessage = function(e) {
        if (e.data.success) {
            const { extractedScripts, discoveredNames, scriptCount, partCount, instanceCount } = e.data;
            
            // 1. Sync visual metric boxes inside your dashboard grid
            if (typeof updateNexusWorkspaceStats === "function") {
                updateNexusWorkspaceStats(scriptCount, partCount, instanceCount);
            }

            // 2. Safely output the recovered scripts to your main preview viewport
            if (extractedScripts.length > 0) {
                previewBox.value = `-- MRTLC NEXUS EXTRAPOLATION (.RBXM DECODED VIA BACKGROUND CORE)\n\n` + 
                                   extractedScripts.map((src, i) => `-- // Reference: [${discoveredNames[i] || "Script_" + (i+1)}]\n${src}`).join("\n\n");
            } else {
                previewBox.value = `-- Binary parsing complete!\n-- Found ${instanceCount} objects, but zero script data was stored inside properties.`;
            }

            if (engineStatus) {
                engineStatus.innerText = "SUCCESS";
                engineStatus.style.color = "var(--neon-green)";
            }
            document.getElementById('download-btn').disabled = false;

        } else {
            // Error handling fallback notice
            previewBox.value = `❌ BACKGROUND MATRIX COMPILATION EXCEPTION:\n${e.data.error}`;
            if (engineStatus) {
                engineStatus.innerText = "FAIL";
                engineStatus.style.color = "#ff3333";
            }
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * ORIGINAL XML PARSING ROUTINE (.RBXMX / .RBXLX)
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
               extractedScripts.map((src, i) => `-- // Decompiled Script Segment [${i+1}]\n${src}`).join("\n\n");
    } else {
        return `-- XML trace completed, but zero code blocks were structured inside ProtectedString tags.`;
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
