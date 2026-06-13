// ============================================================================
//   MRTLC SYSTEM COMPONENT: BACKGROUND BINARY PARSER ENGINE (fiveman1 PIPELINE)
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
        
        // Dynamic search for 'ROBLOX' header markers within the entry byte stream
        let headerFound = false;
        for (let i = 0; i < 20; i++) {
            if (String.fromCharCode(...bytes.subarray(i, i + 6)) === "ROBLOX") {
                offset = i + 14; // Advance pointer past signature parameters
                headerFound = true;
                break;
            }
        }

        // Alternative safety configuration: If header signature fails text decoding, force read past index 14
        if (!headerFound) {
            offset = 14;
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
                // Find property value metadata text strings 
                const propString = String.fromCharCode(...payload.subarray(0, 30));
                
                if (propString.includes("Source")) {
                    // Split past the object references and property name headers
                    let interleaveStream = payload.subarray(12);
                    
                    // Unshuffle strings using the stride formula!
                    let fixedBytes = deInterleaveBuffer(interleaveStream, interleaveStream.length);
                    let cleanSourceText = new TextDecoder().decode(fixedBytes);
                    
                    // Clean null characters and strip string noise formatting tags
                    cleanSourceText = cleanSourceText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "").trim();
                    if (cleanScriptString(cleanSourceText)) {
                        extractedScripts.push(cleanSourceText);
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

/**
 * FILTER LUA SYNTAX VALIDATION
 */
function cleanScriptString(str) {
    if (str.length < 3) return false;
    // Ensure text captures structural syntax identifiers
    return str.includes("local") || str.includes("function") || str.includes("=") || str.includes(":") || str.includes("wait") || str.includes("require");
}
