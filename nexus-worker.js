// ============================================================================
//   MRTLC SYSTEM COMPONENT: BACKGROUND BINARY PARSER ENGINE (fiveman1 PIPELINE)
//   OPTIMIZED FOR PERFORMANCE SHIELDS AND HIGH-SPEED STREAM FILTERING
// ============================================================================

/**
 * NATIVE LZ4 BLOCK UNPACKER
 * Decompresses raw Roblox chunk arrays via bitwise shifts.
 */
function decompressLZ4(input, outputLength) {
    let output = new Uint8Array(outputLength);
    let iIdx = 0, oIdx = 0;

    while (iIdx < input.length) {
        const token = input[iIdx++];
        let literalLength = token >> 4;

        if (literalLength === 15) {
            let b;
            do {
                b = input[iIdx++];
                literalLength += b;
            } while (b === 255);
        }

        for (let i = 0; i < literalLength; i++) {
            output[oIdx++] = input[iIdx++];
        }

        if (iIdx >= input.length) break;

        const offset = input[iIdx++] | (input[iIdx++] << 8);
        if (offset === 0) break;

        let matchLength = token & 0x0F;
        if (matchLength === 15) {
            let b;
            do {
                b = input[iIdx++];
                matchLength += b;
            } while (b === 255);
        }
        matchLength += 4;

        let matchIdx = oIdx - offset;
        for (let i = 0; i < matchLength; i++) {
            output[oIdx++] = output[matchIdx++];
        }
    }
    return output;
}

/**
 * STRIDE MATRIX DE-INTERLEAVER (fiveman1 core math)
 * Reverses the byte-shuffling deck layout used to optimize string storage compression.
 */
function deInterleaveBuffer(payload, totalLength) {
    let restored = new Uint8Array(totalLength);
    let stride = Math.ceil(totalLength / 4);
    
    for (let i = 0; i < totalLength; i++) {
        let blockIndex = i % 4;
        let positionInBlock = Math.floor(i / 4);
        let sourceIndex = (blockIndex * stride) + positionInBlock;
        
        if (sourceIndex < payload.length) {
            restored[i] = payload[sourceIndex];
        }
    }
    return restored;
}

/**
 * MULTI-THREADED MESSAGE INTERCEPT
 */
self.onmessage = async function(e) {
    const { arrayBuffer } = e.data;
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);
    
    try {
        let offset = 0;
        let headerFound = false;
        
        // Dynamic search for 'ROBLOX' header markers within the entry byte stream
        for (let i = 0; i < 20; i++) {
            if (String.fromCharCode(...bytes.subarray(i, i + 6)) === "ROBLOX") {
                offset = i + 14; // Advance pointer past signature parameters
                headerFound = true;
                break;
            }
        }

        if (!headerFound) {
            offset = 14; // Alternative safety configuration fallback
        }
        
        let extractedScripts = [];
        let discoveredNames = [];
        let instanceCount = 0;
        let scriptCount = 0;
        let partCount = 0;

        while (offset < bytes.length) {
            if (offset + 16 > bytes.length) break;
            
            const chunkType = String.fromCharCode(...bytes.subarray(offset, offset + 4));
            offset += 4;
            
            const compLen = view.getUint32(offset, true); offset += 4;
            const decompLen = view.getUint32(offset, true); offset += 4;
            offset += 4; // Skip block flags
            
            let payload = bytes.subarray(offset, offset + compLen);
            offset += compLen;
            
            if (chunkType === "END\x00" || chunkType === "END") break;
            
            if (compLen < decompLen) {
                payload = decompressLZ4(payload, decompLen);
            }
            
            if (chunkType === "INST") {
                const instString = String.fromCharCode(...payload);
                scriptCount += (instString.match(/Script/g) || []).length;
                partCount += (instString.match(/Part/g) || []).length;
                instanceCount += 1;
            } 
            
            else if (chunkType === "PROP") {
                // Read the first 30 bytes to inspect the class descriptor metadata
                const propString = String.fromCharCode(...payload.subarray(0, 30));
                
                // PERFORMANCE SHIELD: If this property belongs to 3D geometry or physics, skip it immediately!
                if (propString.includes("CFrame") || 
                    propString.includes("Velocity") || 
                    propString.includes("Physics") || 
                    propString.includes("Extents") ||
                    propString.includes("FormFactor")) {
                    continue; 
                }
                
                if (propString.includes("Source")) {
                    let interleaveStream = payload.subarray(12);
                    let restoredBytes = deInterleaveBuffer(interleaveStream, interleaveStream.length);
                    let cleanSrc = new TextDecoder().decode(restoredBytes);
                    
                    // Aggressively wipes control characters and unprintable binary metadata bytes
                    cleanSrc = cleanSrc.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "").trim();
                    
                    if (cleanSrc.length > 2) {
                        extractedScripts.push(cleanSrc);
                    }
                } 
                else if (propString.includes("Name")) {
                    const nameText = String.fromCharCode(...payload.subarray(12)).replace(/[\x00-\x1F]/g, "").trim();
                    if (nameText.length > 1 && nameText.length < 32 && !nameText.includes("Property") && !nameText.includes("Source")) {
                        discoveredNames.push(nameText);
                    }
                }
            }
        }

        // Send structural results back to the main thread UI interface
        self.postMessage({
            success: true,
            extractedScripts,
            discoveredNames,
            scriptCount: extractedScripts.length || scriptCount,
            partCount,
            instanceCount: instanceCount || 1
        });

    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};
