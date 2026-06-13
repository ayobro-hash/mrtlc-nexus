// --- MRTLC NEXUS v4.8: EXPLICIT PROTOCOL TRAFFIC ROUTER ---

// Establish background thread pipeline
const decompilerWorker = new Worker('nexus-worker.js');

/**
 * UNBREAKABLE MASTER INTERCEPT ACTION
 * Forces rigid structural routing based on file extensions.
 */
async function executeNexusCompilation() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const reader = new FileReader();
    const previewBox = document.getElementById('code-preview-box');
    const engineStatus = document.getElementById('engine-status');

    if (previewBox) previewBox.value = "⚡ ROUTING FILE DATA TO ISOLATED THREAD CORE...";

    // Extract file extension cleanly
    const fileName = file.name.toLowerCase();
    const isBinaryFile = fileName.endsWith('.rbxm') || fileName.endsWith('.rbxl');

    reader.onload = async (e) => {
        const buffer = e.target.result;
        
        if (isBinaryFile) {
            console.log("MRTLC Hard Router: FORCING binary worker path for " + file.name);
            decompilerWorker.postMessage({ arrayBuffer: buffer });
        } else {
            console.log("MRTLC Hard Router: FORCING XML text path for " + file.name);
            const textContent = new TextDecoder().decode(buffer);
            const finalOutput = parseXmlRobloxModel(textContent);
            
            if (previewBox) previewBox.value = finalOutput;
            if (engineStatus) {
                engineStatus.innerText = finalOutput.includes("⚠️") ? "NOTICE" : "SUCCESS";
                engineStatus.style.color = finalOutput.includes("⚠️") ? "#ffaa00" : "var(--neon-green)";
            }
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * RE-ENGINEERED XML TEXT PARSER
 * Standardized strict tracking for valid XML layouts.
 */
function parseXmlRobloxModel(xmlText) {
    // Ensure this is actually an XML layout file before checking tags
    if (!xmlText.trim().startsWith("<roblox")) {
        return `-- ⚠️ PARSER NOTICE: FILE FORMAT MISMATCH\n\n` +
               `This file was read by the text engine, but it does not contain a valid XML header layout.\n` +
               `If this is an .rbxm binary file, make sure the file extension is named correctly so the app routes it to the binary core!`;
    }

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
        return `-- ⚠️ XML NOTICE: EMPTY SCRIPTS\n\nParsed the XML architecture successfully, but the script files contain zero lines of code.`;
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

// Global interface response connector from background worker
decompilerWorker.onmessage = function(e) {
    const previewBox = document.getElementById('code-preview-box');
    const engineStatus = document.getElementById('engine-status');
    
    if (e.data.success) {
        const { extractedScripts, discoveredNames, scriptCount, partCount, instanceCount } = e.data;
        
        if (typeof updateNexusWorkspaceStats === "function") {
            updateNexusWorkspaceStats(scriptCount, partCount, instanceCount);
        }

        if (extractedScripts.length > 0) {
            previewBox.value = `-- MRTLC NEXUS NATIVE BINARY COMPILATION (.RBXM DECODED)\n\n` + 
                               extractedScripts.map((src, i) => `-- // Script ID: [${discoveredNames[i] || "ModuleScript_" + (i+1)}]\n${src}`).join("\n\n");
            if (engineStatus) {
                engineStatus.innerText = "SUCCESS";
                engineStatus.style.color = "var(--neon-green)";
            }
        } else {
            previewBox.value = `-- ⚠️ DECOMPILATION NOTICE: BINARY CONTAINER DETECTED\n\nThe file parsed successfully, but zero script strings could be recovered from the property arrays.`;
            if (engineStatus) {
                engineStatus.innerText = "NOTICE";
                engineStatus.style.color = "#ffaa00";
            }
        }
    } else {
        previewBox.value = `❌ CORE DECOMPILER CRASH:\n${e.data.error}`;
        if (engineStatus) {
            engineStatus.innerText = "FAIL";
            engineStatus.style.color = "#ff3333";
        }
    }
};
