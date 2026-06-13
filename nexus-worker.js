// Ensure this structure maps to the global interface listener above
self.onmessage = async function(e) {
    const { arrayBuffer } = e.data;
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);
    
    try {
        let offset = 14; // Start immediately past ROBLOX banner array
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
                const propString = String.fromCharCode(...payload.subarray(0, 30));
                
                if (propString.includes("Source")) {
                    let interleaveStream = payload.subarray(12);
                    let stride = Math.ceil(interleaveStream.length / 4);
                    let restored = new Uint8Array(interleaveStream.length);
                    
                    // fiveman1 restoration loop matrix logic
                    for (let i = 0; i < interleaveStream.length; i++) {
                        let blockIndex = i % 4;
                        let pos = Math.floor(i / 4);
                        let srcIdx = (blockIndex * stride) + pos;
                        if (srcIdx < interleaveStream.length) restored[i] = interleaveStream[srcIdx];
                    }
                    
                    let cleanSrc = new TextDecoder().decode(restored).replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, "").trim();
                    if (cleanSrc.length > 2 && (cleanSrc.includes("local") || cleanSrc.includes("function") || cleanSrc.includes("="))) {
                        extractedScripts.push(cleanSrc);
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

// Paste your existing decompressLZ4 helper function right beneath this loop...
