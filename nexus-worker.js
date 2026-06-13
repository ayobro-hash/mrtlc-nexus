// ============================================================================
//   MRTLC SYSTEM COMPONENT: BACKGROUND BINARY PARSER ENGINE (fiveman1 BUILD)
// ============================================================================

/**
 * LZ4 BLOCK DECOMPRESSOR
 * Unpacks compressed chunk segments from the binary stream.
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
 * FIVEAMN1 DE-INTERLEAVE ALGORITHM
 * Reverses the byte-shuffling deck optimization applied to long strings.
 */
function deInterleaveBuffer(payload, totalLength) {
    let restored = new Uint8Array(totalLength);
    let stride = Math.ceil(totalLength / 4);
    
    for (let i = 0; i < totalLength; i++) {
        let blockIndex = i % 4;
        let positionInBlock = Math.floor(i / 4);
        let sourceIndex = (blockIndex * stride) + positionInBlock;
        
        restored[i] = payload[sourceIndex];
    }
    return restored;
}

/**
 * BACKGROUND WORKER MESSAGE LISTENER
 * Listens for the file buffer sent from the main website interface.
 */
self.onmessage = async function(e) {
    const { arrayBuffer } = e.data;
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);
    
    try {
        // Validate magic signature "ROBLOX"
        const sig = String.fromCharCode(...bytes.subarray(0, 6));
        if (sig !== "ROBLOX") {
            throw new Error("INVALID_HEADER: Not a valid Roblox binary file.");
        }
        
        let offset = 14; 
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
            offset += 4; // Skip flags
            
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
                const propName = String.fromCharCode(...payload.subarray(4, 10));
                
                if (propName === "Source") {
                    let interleaveStream = payload.subarray(12);
                    let fixedBytes = deInterleaveBuffer(interleaveStream, interleaveStream.length);
                    let cleanSourceText = new TextDecoder().decode(fixedBytes);
                    
                    cleanSourceText = cleanSourceText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "").trim();
                    if (cleanSourceText.length > 0) {
                        extractedScripts.push(cleanSourceText);
                    }
                } 
                else if (propName === "Name\x00" || propName === "Name") {
                    const nameText = String.fromCharCode(...payload.subarray(12)).replace(/[\x00-\x1F]/g, "").trim();
                    if (nameText.length > 1 && nameText.length < 32 && !nameText.includes("Property")) {
                        discoveredNames.push(nameText);
                    }
                }
            }
        }

        // Send results back to main thread
        self.postMessage({
            success: true,
            extractedScripts,
            discoveredNames,
            scriptCount: extractedScripts.length || scriptCount,
            partCount,
            instanceCount
        });

    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};
