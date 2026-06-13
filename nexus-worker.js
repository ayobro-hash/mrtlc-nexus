// nexus-worker.js - High-Performance Binary Signature Scanner

self.onmessage = async (event) => {
    const arrayBuffer = event.data;

    try {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Target file chunk buffer is entirely empty.");
        }

        console.log(`[MRTLC NEXUS] Slicing binary byte matrix: ${arrayBuffer.byteLength} bytes.`);

        const uint8Array = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder("utf-8");

        // 1. Instantly sniff for XML layout vs Raw Binary
        const signature = decoder.decode(uint8Array.subarray(0, 8));
        
        if (signature.startsWith("<roblox")) {
            console.log("[MRTLC NEXUS] Plain-text XML footprint verified.");
            const xmlText = decoder.decode(arrayBuffer);
            self.postMessage({ success: true, isXml: true, xmlData: xmlText });
            return;
        }

        // 2. BINARY EXTRACTION MATRIX: Scan memory buffers directly for Script Source structures
        console.log("[MRTLC NEXUS] Scanning binary chunks via direct byte matching...");
        
        // Convert the entire file buffer into a raw text stream safely to extract script content
        const rawContentString = decoder.decode(uint8Array);
        
        const instances = [{
            ClassName: "DataModel",
            Name: "MRTLC Nexus Workspace",
            Source: null,
            Children: []
        }];

        // Look for common patterns where Roblox stores raw Lua source text blocks inside PROP chunks
        // This splits by typical Lua structural markers rather than rigid file versions
        const luaScriptBlocks = [];
        
        // Let's sweep for any blocks starting with standard comments or keyword initializations
        const scriptRegex = /(?:--\[\[[\s\S]*?\]\]|--[^\n]*|\blocal\b\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=)/g;
        let match;
        let scriptIndex = 1;

        // Extract raw chunks that contain meaningful Lua script structures
        while ((match = scriptRegex.exec(rawContentString)) !== null) {
            // Grab a healthy chunk of the source text around the match
            const startPos = match.index;
            // Scan forward until we hit a binary boundary null terminator (\x00) or massive gap
            let endPos = rawContentString.indexOf('\x00', startPos);
            if (endPos === -1 || endPos - startPos > 50000) {
                endPos = startPos + 2000; // Fallback bound chunk size
            }

            const extractedChunk = rawContentString.substring(startPos, endPos).trim();
            
            // Only capture valid text payloads that don't look like fragmented junk data
            if (extractedChunk.length > 20 && !luaScriptBlocks.includes(extractedChunk)) {
                luaScriptBlocks.push(extractedChunk);
                
                instances[0].Children.push({
                    ClassName: "LuaScriptChunk",
                    Name: `Extracted_Script_Stream_${scriptIndex++}`,
                    Source: extractedChunk,
                    Children: []
                });
            }

            // Safety check to prevent run-away regex parsing loops on huge files
            if (luaScriptBlocks.length >= 100) break;
        }

        if (instances[0].Children.length === 0) {
            instances[0].Children.push({
                ClassName: "Script",
                Name: "System_Notification",
                Source: `-- [MRTLC NEXUS] Extraction Complete.\n-- No raw text script blocks were identified in the binary layout chunks.\n-- Total Checked Matrix Size: ${arrayBuffer.byteLength} bytes.`,
                Children: []
            });
        }

        self.postMessage({ success: true, isXml: false, data: instances });

    } catch (error) {
        console.error("[MRTLC WORKER SYSTEM FAULT]", error);
        self.postMessage({ success: false, error: error.message });
    }
};
