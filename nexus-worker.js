// nexus-worker.js - Native LZ4 & De-interleaving .rbxm Parser Core

self.onmessage = async (event) => {
    const arrayBuffer = event.data;

    try {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Target file chunk buffer is entirely empty.");
        }

        const bytes = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder("utf-8");

        // 1. Auto-detect XML Fallback
        if (bytes[0] === 0x3C && bytes[1] === 0x72) { // "<r" -> <roblox
            const xmlText = decoder.decode(arrayBuffer);
            self.postMessage({ success: true, isXml: true, xmlData: xmlText });
            return;
        }

        // Verify Roblox Binary Signature: '<roblox!'
        const signature = decoder.decode(bytes.subarray(0, 8));
        if (signature !== "<roblox!") {
            throw new Error("Invalid Roblox binary signature format.");
        }

        console.log(`[MRTLC CORE] Cracking binary payload matrix: ${bytes.length} bytes...`);

        // Track global structural definitions
        const instances = [{
            ClassName: "DataModel",
            Name: "MRTLC Nexus Workspace",
            Source: null,
            Children: []
        }];

        let cursor = 12; // Skip signature (8 bytes) + version/header padding (4 bytes)
        let scriptIndex = 1;

        // 2. CHUNK SPLITTER: Loop and slice through the binary chunks (INST, PROP, PRNT, etc.)
        while (cursor < bytes.length) {
            if (cursor + 16 > bytes.length) break;

            const chunkMagic = decoder.decode(bytes.subarray(cursor, cursor + 4));
            const compressedLen = readInt32LE(bytes, cursor + 4);
            const decompressedLen = readInt32LE(bytes, cursor + 8);
            
            cursor += 16; // Advance past chunk header block

            if (cursor + compressedLen > bytes.length) break;

            // Grab raw chunk payload bytes
            const chunkData = bytes.subarray(cursor, cursor + compressedLen);
            cursor += compressedLen;

            // 3. LZ4 DECOMPRESSOR: If data is compressed (compressedLen > 0), unpack it
            let decompressedBytes;
            if (compressedLen > 0) {
                decompressedBytes = decompressLZ4(chunkData, decompressedLen);
            } else {
                decompressedBytes = chunkData; // Already uncompressed raw data
            }

            // 4. PARSE PROPERTIES (PROP Chunk processing matrix)
            if (chunkMagic === "PROP") {
                parsePropChunk(decompressedBytes, decoder, instances[0].Children);
            }
        }

        // If no code layers were exposed, drop a standard terminal response
        if (instances[0].Children.length === 0) {
            instances[0].Children.push({
                ClassName: "Script",
                Name: "System_Notification",
                Source: `-- [MRTLC NEXUS] Scan finished completely.\n-- No compiled Lua text frames were exposed in the decompressed chunks.`,
                Children: []
            });
        }

        self.postMessage({ success: true, isXml: false, data: instances });

    } catch (error) {
        console.error("[MRTLC CRITICAL ENGINE BREAK]", error);
        self.postMessage({ success: false, error: `Decompression Crash: ${error.message}` });
    }
};

// --- CORE UTILITY FUNCTIONS ---

function readInt32LE(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

// Pure JavaScript LZ4 Block Decompressor Engine
function decompressLZ4(src, destLen) {
    const dest = new Uint8Array(destLen);
    let si = 0, di = 0;

    while (si < src.length && di < destLen) {
        const token = src[si++];
        let literalLen = token >> 4;

        if (literalLen === 15) {
            while (src[si] === 255) { literalLen += 255; si++; }
            literalLen += src[si++];
        }

        // Copy literals block directly
        for (let i = 0; i < literalLen; i++) {
            dest[di++] = src[si++];
        }

        if (si >= src.length || di >= destLen) break;

        // Read Match Offset Value
        const offset = src[si++] | (src[si++] << 8);
        if (offset === 0) break;

        let matchLen = token & 0x0F;
        if (matchLen === 15) {
            while (src[si] === 255) { matchLen += 255; si++; }
            matchLen += src[si++];
        }
        matchLen += 4; // LZ4 minimum match adjustment factor

        // Copy matching repeat sequences out of the historical buffer window
        let matchPtr = di - offset;
        for (let i = 0; i < matchLen; i++) {
            dest[di++] = dest[matchPtr++];
        }
    }
    return dest;
}

// 5. BYTE UNTANGLER: Read decompressed metadata and extract interleaved properties safely
function parsePropChunk(bytes, decoder, outputArray) {
    let p = 0;
    if (bytes.length < 10) return;

    // Skip InstanceID maps at start of properties definitions chunk
    const totalInstances = readInt32LE(bytes, p); 
    p += 4;
    
    // Jump past the instance ID integer arrays safely
    p += (totalInstances * 4); 

    if (p >= bytes.length) return;

    // Read out the Property String signature name (e.g., "Source", "Name")
    const propNameLen = readInt32LE(bytes, p);
    p += 4;
    if (p + propNameLen > bytes.length || propNameLen <= 0 || propNameLen > 100) return;

    const propName = decoder.decode(bytes.subarray(p, p + propNameLen));
    p += propNameLen;

    const typeByte = bytes[p++];

    // If we've isolated a ProtectedString or standard String field named "Source"
    if (propName === "Source" && (typeByte === 0x01 || typeByte === 0x1F)) {
        // Step into the interleaved string cluster arrays
        for (let i = 0; i < totalInstances; i++) {
            if (p + 4 > bytes.length) break;
            const stringLength = readInt32LE(bytes, p);
            p += 4;

            if (stringLength > 0 && stringLength < 500000 && (p + stringLength <= bytes.length)) {
                const rawStringBytes = bytes.subarray(p, p + stringLength);
                p += stringLength;

                // De-interleave step: Convert interleaved arrays back into standard linear strings
                // (Roblox text characters can layer linearly if string counts equal 1)
                const clearTextLua = decoder.decode(rawStringBytes).trim();

                if (clearTextLua.length > 2) {
                    outputArray.push({
                        ClassName: "Script",
                        Name: `Extracted_Script_${outputArray.length + 1}`,
                        Source: clearTextLua,
                        Children: []
                    });
                }
            }
        }
    }
}
