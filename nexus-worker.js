// nexus-worker.js - Strict Binary Type Auto-Detection Engine

self.onmessage = async (event) => {
    const arrayBuffer = event.data;

    try {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Target file chunk buffer is entirely empty.");
        }

        const bytes = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder("utf-8");

        // 1. STRICT XML CHECK: Must start completely with "<roblox" text signature
        const initialText = decoder.decode(bytes.subarray(0, 7));
        if (initialText.startsWith("<roblox")) {
            console.log("[MRTLC NEXUS] True plain-text XML layout confirmed.");
            const xmlText = decoder.decode(arrayBuffer);
            self.postMessage({ success: true, isXml: true, xmlData: xmlText });
            return;
        }

        // 2. STRICT BINARY CHECK: Verify actual '<roblox!' header structure
        const binarySignature = decoder.decode(bytes.subarray(0, 8));
        if (binarySignature !== "<roblox!") {
            throw new Error("Invalid or unrecognizable Roblox asset file signature format.");
        }

        console.log(`[MRTLC CORE] Processing True Binary Character Model: ${bytes.length} bytes...`);

        let instanceClasses = [];
        let instanceNames = [];
        let prntRelations = [];
        let cursor = 12;

        // Extract through individual asset format layout streams
        while (cursor < bytes.length) {
            if (cursor + 16 > bytes.length) break;

            const chunkMagic = decoder.decode(bytes.subarray(cursor, cursor + 4));
            const compressedLen = readInt32LE(bytes, cursor + 4);
            const decompressedLen = readInt32LE(bytes, cursor + 8);
            
            cursor += 16;
            if (cursor + compressedLen > bytes.length) break;

            const chunkData = bytes.subarray(cursor, cursor + compressedLen);
            cursor += compressedLen;

            const decompressedBytes = compressedLen > 0 ? decompressLZ4(chunkData, decompressedLen) : chunkData;

            if (chunkMagic === "INST") {
                parseInstChunk(decompressedBytes, decoder, instanceClasses);
            }
            else if (chunkMagic === "PROP") {
                parsePropChunk(decompressedBytes, decoder, instanceNames);
            }
            else if (chunkMagic === "PRNT") {
                parsePrntChunk(decompressedBytes, prntRelations);
            }
        }

        const treeStructure = buildWorkspaceTree(instanceClasses, instanceNames, prntRelations);

        // Send the real structured character model array layout straight to the parser
        self.postMessage({ success: true, isXml: false, data: treeStructure });

    } catch (error) {
        console.error("[MRTLC CRITICAL ENGINE BREAK]", error);
        self.postMessage({ success: false, error: `Decompression Crash: ${error.message}` });
    }
};

// --- READ HELPER MATHS ---
function readInt32LE(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

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
        for (let i = 0; i < literalLen; i++) dest[di++] = src[si++];
        if (si >= src.length || di >= destLen) break;
        const offset = src[si++] | (src[si++] << 8);
        if (offset === 0) break;
        let matchLen = token & 0x0F;
        if (matchLen === 15) {
            while (src[si] === 255) { matchLen += 255; si++; }
            matchLen += src[si++];
        }
        matchLen += 4;
        let matchPtr = di - offset;
        for (let i = 0; i < matchLen; i++) dest[di++] = dest[matchPtr++];
    }
    return dest;
}

function parseInstChunk(bytes, decoder, instanceClasses) {
    let p = 0;
    if (bytes.length < 13) return;
    const classId = readInt32LE(bytes, p); p += 4;
    const classNameLen = readInt32LE(bytes, p); p += 4;
    const className = decoder.decode(bytes.subarray(p, p + classNameLen)); p += classNameLen;
    p += 1; 
    const objectCount = readInt32LE(bytes, p); p += 4;

    for (let i = 0; i < objectCount; i++) {
        if (p + 4 > bytes.length) break;
        const refId = readInt32LE(bytes, p); p += 4;
        instanceClasses.push({ refId: refId, ClassName: className, Name: className, Children: [] });
    }
}

function parsePropChunk(bytes, decoder, instanceNames) {
    let p = 0;
    if (bytes.length < 10) return;
    const totalInstances = readInt32LE(bytes, p); p += 4;
    p += (totalInstances * 4); 

    const propNameLen = readInt32LE(bytes, p); p += 4;
    const propName = decoder.decode(bytes.subarray(p, p + propNameLen)); p += propNameLen;
    const typeByte = bytes[p++];

    if (propName === "Name" && typeByte === 0x01) {
        for (let i = 0; i < totalInstances; i++) {
            if (p + 4 > bytes.length) break;
            const stringLen = readInt32LE(bytes, p); p += 4;
            if (stringLen > 0 && p + stringLen <= bytes.length) {
                const nameStr = decoder.decode(bytes.subarray(p, p + stringLen));
                p += stringLen;
                instanceNames.push(nameStr);
            }
        }
    }
}

function parsePrntChunk(bytes, prntRelations) {
    let p = 0;
    if (bytes.length < 5) return;
    p += 1; 
    const objectCount = readInt32LE(bytes, p); p += 4;
    
    const childIds = [];
    for(let i=0; i<objectCount; i++) { childIds.push(readInt32LE(bytes, p)); p+=4; }
    const parentIds = [];
    for(let i=0; i<objectCount; i++) { parentIds.push(readInt32LE(bytes, p)); p+=4; }

    for (let i = 0; i < objectCount; i++) {
        prntRelations.push({ child: childIds[i], parent: parentIds[i] });
    }
}

function buildWorkspaceTree(classes, names, relations) {
    classes.forEach((item, index) => {
        if (names[index]) item.Name = names[index];
    });

    const lookup = {};
    classes.forEach(item => lookup[item.refId] = item);
    const rootNodes = [];

    relations.forEach(rel => {
        const childNode = lookup[rel.child];
        const parentNode = lookup[rel.parent];
        if (childNode) {
            if (parentNode) {
                parentNode.Children.push(childNode);
            } else {
                rootNodes.push(childNode);
            }
        }
    });

    return rootNodes.length > 0 ? rootNodes : [{ ClassName: "Model", Name: "Character Rig Layout", Children: classes }];
}
