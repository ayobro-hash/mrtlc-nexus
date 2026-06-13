// nexus-worker.js - Streaming Binary Byte Scanner for MRTLC Nexus

self.onmessage = async (event) => {
    const arrayBuffer = event.data;

    try {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Target file chunk buffer is entirely empty.");
        }

        const bytes = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder("utf-8");

        // 1. Instantly sniff for XML layout vs Raw Binary
        if (bytes[0] === 0x3C && bytes[1] === 0x72) { // "<r" -> <roblox
            console.log("[MRTLC NEXUS] Plain-text XML footprint verified.");
            const xmlText = decoder.decode(arrayBuffer);
            self.postMessage({ success: true, isXml: true, xmlData: xmlText });
            return;
        }

        console.log(`[MRTLC NEXUS] Streaming byte-stream: ${bytes.length} bytes.`);
        
        const instances = [{
            ClassName: "DataModel",
            Name: "MRTLC Nexus Workspace",
            Source: null,
            Children: []
        }];

        // 2. BYTE SCANNER: Search directly for the "Source" property marker sequence
        // Hex signatures: S(53) o(6F) u(75) r(72) c(63) e(65)
        const targetSequence = [0x53, 0x6F, 0x75, 0x72, 0x63, 0x65]; 
        let scriptIndex = 1;

        for (let i = 0; i < bytes.length - targetSequence.length; i++) {
            let match = true;
            for (let j = 0; j < targetSequence.length; j++) {
                if (bytes[i + j] !== targetSequence[j]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                // Moving past "Source" string block (6 bytes)
                let dataPointer = i + 6;

                // Roblox binary properties generally use a type byte identifier next (0x1F for ProtectedString)
                if (bytes[dataPointer] === 0x1F) {
                    dataPointer++; // Skip type block identifier
                }

                // Read the next 4 bytes as a 32-bit Little-Endian integer to get the exact string length
                if (dataPointer + 4 <= bytes.length) {
                    const stringLength = bytes[dataPointer] | 
                                         (bytes[dataPointer + 1] << 8) | 
                                         (bytes[dataPointer + 2] << 16) | 
                                         (bytes[dataPointer + 3] << 24);

                    dataPointer += 4; // Step over length integer definition

                    // Verify boundaries and extract code string block directly
                    if (stringLength > 0 && stringLength < 500000 && (dataPointer + stringLength <= bytes.length)) {
                        const rawScriptBytes = bytes.subarray(dataPointer, dataPointer + stringLength);
                        const extractedLua = decoder.decode(rawScriptBytes).trim();

                        // Clean up any stray non-printable data out of the text window
                        if (extractedLua.length > 5 && /^[\x20-\x7E\s\r\n\t]+$/.test(extractedLua.substring(0, 10))) {
                            instances[0].Children.push({
                                ClassName: "Script",
                                Name: `Extracted_Script_${scriptIndex++}`,
                                Source: extractedLua,
                                Children: []
                            });
                        }
                    }
                }
            }
        }

        // Fallback interface report if no explicit strings are pulled out
        if (instances[0].Children.length === 0) {
            instances[0].Children.push({
                ClassName: "Script",
                Name: "System_Notification",
                Source: `-- [MRTLC NEXUS] Extraction finished cleanly.\n-- No compiled Lua source streams found inside this 1MB file block.\n-- The binary script data may be completely empty or fully unscripted inside Studio.`,
                Children: []
            });
        }

        self.postMessage({ success: true, isXml: false, data: instances });

    } catch (error) {
        console.error("[MRTLC WORKER ERROR]", error);
        self.postMessage({ success: false, error: error.message });
    }
};
