// --- MRTLC NEXUS v3.5: MASTER DECOMPILER & PARSER ENGINE (INTEGRATED BINARY BUILD) ---

/**
 * UTILITY COMPONENT: LIGHTWEIGHT LZ4 BLOCK DECOMPRESSOR
 * Unpacks the internal compressed chunk buffers utilized by modern Roblox binary formatting.
 */
function decompressLZ4(inputUint8Array, outputLength) {
    let output = new Uint8Array(outputLength);
    let iIdx = 0, oIdx = 0;

    while (iIdx < inputUint8Array.length) {
        const token = inputUint8Array[iIdx++];
        let literalLength = token >> 4;

        if (literalLength === 15) {
            let b;
            do {
                b = inputUint8Array[iIdx++];
                literalLength += b;
            } while (b === 255);
        }

        // Copy literals directly into output array
        for (let i = 0; i < literalLength; i++) {
            output[oIdx++] = inputUint8Array[iIdx++];
        }

        if (iIdx >= inputUint8Array.length) break;

        // Extract offset lookback pointer
        const offset = inputUint8Array[iIdx++] | (inputUint8Array[iIdx++] << 8);
        if (offset === 0) break;

        let matchLength = token & 0x0F;
        if (matchLength === 15) {
            let b;
            do {
                b = inputUint8Array[iIdx++];
                matchLength += b;
            } while (b === 255);
        }
        matchLength += 4;

        // Duplicate past dictionary sequence matching strings
        let matchIdx = oIdx - offset;
        for (let i = 0; i < matchLength; i++) {
            output[oIdx++] = output[matchIdx++];
        }
    }
    return output;
}

/**
 * AUTOMATED FILE CONTROLLER GATEWAY
 * Invoked when clicking the main compiler button layout matrix.
 */
async function executeNexusCompilation() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    const reader = new FileReader();
    const previewBox = document.getElementById('code-preview-box');
    const engineStatus = document.getElementById('engine-status');

    if (previewBox) previewBox.value = "⚡ PROCESSING MATRIX CHUNKS...";

    reader.onload = async (e) => {
        const buffer = e.target.result;
        const testBytes = new Uint8Array(buffer);

        try {
            let finalOutput = "";
            // Verify if target chunk begins with "ROBLOX" binary magic array
            const isBinary = String.fromCharCode(...testBytes.subarray(0, 6)) === "ROBLOX";

            if (isBinary) {
                finalOutput = await parseBinaryRobloxModel(buffer);
            } else {
                const textContent = new TextDecoder().decode(buffer);
                finalOutput = parseXmlRobloxModel(textContent);
            }

            if (previewBox) previewBox.value = finalOutput;
            if (engineStatus) {
                engineStatus.innerText = "SUCCESS";
                engineStatus.style.color = "var(--neon-green)";
            }
            
            const downloadBtn = document.getElementById('download-btn');
            if (downloadBtn) downloadBtn.disabled = false;

        } catch (err) {
            console.error(err);
            if (previewBox) previewBox.value = `❌ PARSING ENGINE CRASH EVENT:\n${err.message}`;
            if (engineStatus) {
                engineStatus.innerText = "FAIL";
                engineStatus.style.color = "#ff3333";
            }
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * PIPELINE PIPING 1: COMPLEX BINARY PARSER (.RBXM / .RBXL)
 * Deconstructs serialized byte data streams, processes LZ4 steps, and extracts hidden .Source arrays
 */
async function parseBinaryRobloxModel(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);

    let currentIndex = 14; // Forward pointer past structural header metadata strings
    let extractedScripts = [];
    let instanceCount = 0;
    let scriptCount = 0;
    let partCount = 0;
    let fallbackTreeText = "Workspace\n";

    while (currentIndex < bytes.length) {
        if (currentIndex + 16 > bytes.length) break;

        // Parse chunk signature identity text arrays (e.g. INST, PROP, PRNT)
        const chunkType = String.fromCharCode(...bytes.subarray(currentIndex, currentIndex + 4));
        currentIndex += 4;

        const compressedLen = view.getUint32(currentIndex, true);
        currentIndex += 4;
        const decompressedLen = view.getUint32(currentIndex, true);
        currentIndex += 4;
        
        currentIndex += 4; // Skip reserved chunk flags

        let chunkPayload = bytes.subarray(currentIndex, currentIndex + compressedLen);
        currentIndex += compressedLen;

        // Decompress raw data array block if LZ4 bit flag matches
        if (compressedLen < decompressedLen) {
            chunkPayload = decompressLZ4(chunkPayload, decompressedLen);
        }

        // Handle Object Class Counts
        if (chunkType === "INST") {
            const instView = new DataView(chunkPayload.buffer, chunkPayload.byteOffset, chunkPayload.byteLength);
            if (instView.byteLength >= 4) {
                instanceCount += instView.getUint32(0, true);
            }
            
            const instString = String.fromCharCode(...chunkPayload);
            // Count instance definitions
            const scriptMatches = (instString.match(/Script/g) || []).length;
            const partMatches = (instString.match(/Part/g) || []).length;
            scriptCount += scriptMatches;
            partCount += partMatches;

        // Handle Property Field Extraction
        } else if (chunkType === "PROP") {
            const propDataString = String.fromCharCode(...chunkPayload);
            
            if (propDataString.includes("Source")) {
                // Regex scanning block to isolate clean code strings out of binary blobs
                const codeBlocks = propDataString.match(/[\x20-\x7E\x0A\x0D]{12,}/g) || [];
                codeBlocks.forEach(code => {
                    const cleanCode = code.trim();
                    // Clean structural properties to ensure only true code sequences parse
                    if (!cleanCode.includes("Script") && 
                        !cleanCode.includes("Value") && 
                        !cleanCode.includes("Source") &&
                        cleanCode.length > 4) {
                        extractedScripts.push(cleanCode);
                    }
                });
            }
        }
    }

    // Sync metrics grid panel located inside nexus-ui.js
    if (typeof updateNexusWorkspaceStats === "function") {
        updateNexusWorkspaceStats(scriptCount || extractedScripts.length, partCount, instanceCount || 1);
    }

    // Generate lightweight visual explorer mock hierarchy
    const treeView = document.getElementById('tree-view');
    if (treeView) {
        let treeHtml = `<div class="tree-node">📁 Model Root Instance [Binary Array Stream]</div>`;
        for (let s = 0; s < (scriptCount || extractedScripts.length); s++) {
            treeHtml += `<div class="tree-node" style="margin-left: 20px;">📜 ExtractedScript_${s+1}</div>`;
        }
        treeView.innerHTML = treeHtml;
    }

    if (extractedScripts.length > 0) {
        return `-- MRTLC NEXUS EXTRAPOLATION SOURCE DUMP (.RBXM BINARY)\n\n` + 
               extractedScripts.map((src, i) => `-- // ExtractedScript_${i+1}\n${src}`).join("\n\n");
    } else {
        return `-- Binary analysis successful, but zero active script source blocks were contained inside properties.`;
    }
}

/**
 * PIPELINE PIPING 2: XML DOM TEXT REGEX PARSER (.RBXLX / .RBXMX)
 */
function parseXmlRobloxModel(xmlText) {
    let scriptCount = 0;
    let partCount = 0;
    let instanceCount = 0;
    let extractedScripts = [];

    // Tally up structures across XML tree arrays
    scriptCount = (xmlText.match(/class="[^"]*Script"/gi) || []).length;
    partCount = (xmlText.match(/class="Part"/gi) || []).length;
    instanceCount = (xmlText.match(/<Item/gi) || []).length;

    // Isolate code text values between Source blocks
    const sourceRegex = /<ProtectedString name="Source"><!\[CDATA\[([\s\S]*?)\]\]><\/ProtectedString>/g;
    let match;
    
    while ((match = sourceRegex.exec(xmlText)) !== null) {
        if (match[1] && match[1].trim().length > 0) {
            extractedScripts.push(match[1].trim());
        }
    }

    // Sync metrics grid panel located inside nexus-ui.js
    if (typeof updateNexusWorkspaceStats === "function") {
        updateNexusWorkspaceStats(scriptCount, partCount, instanceCount);
    }

    // Build interactive file tree visual explorer elements
    const treeView = document.getElementById('tree-view');
    if (treeView) {
        let treeHtml = `<div class="tree-node">📁 DataModel Root [XML Context Tree]</div>`;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const items = xmlDoc.getElementsByTagName("Item");

        let displayedItems = 0;
        for (let i = 0; i < items.length; i++) {
            if (displayedItems > 60) break; // Keep mobile DOM performant and lightweight
            let className = items[i].getAttribute("class");
            let nameNode = items[i].querySelector('Properties > string[name="Name"]');
            let name = nameNode ? nameNode.textContent : className;

            if (className && name) {
                let icon = className.includes("Script") ? "📜" : "📦";
                treeHtml += `<div class="tree-node" style="margin-left: 15px;">${icon} [${className}] - ${name}</div>`;
                displayedItems++;
            }
        }
        treeView.innerHTML = treeHtml;
    }

    if (extractedScripts.length > 0) {
        return `-- MRTLC NEXUS EXTRAPOLATION SOURCE DUMP (.RBXXML)\n\n` + 
               extractedScripts.map((src, i) => `-- // Compiled Script Segment [${i+1}]\n${src}`).join("\n\n");
    } else {
        return `-- XML trace completed, but no active script strings were mapped inside ProtectedString tags.`;
    }
}

/**
 * FILE MATRIX DISPATCH TRACKER ROUTINES
 */
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
    
    const engineStatus = document.getElementById('engine-status');
    if (engineStatus) {
        engineStatus.innerText = "ARMED";
        engineStatus.style.color = "var(--accent)";
    }
}

/**
 * LUA EXPORT UTILITY STREAMER
 */
function triggerScriptDownload() {
    const previewBox = document.getElementById('code-preview-box');
    if (!previewBox || !previewBox.value) return;

    const fileBlob = new Blob([previewBox.value], { type: "text/plain;charset=utf-8" });
    const downloadLink = document.createElement("a");
    
    downloadLink.href = URL.createObjectURL(fileBlob);
    downloadLink.download = "nexus_compiled_source.lua";
    downloadLink.style.display = "none";
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
                }
