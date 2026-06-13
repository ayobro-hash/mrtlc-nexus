// nexus-worker.js - Modern rbxm-parser-ts Engine Implementation
import { RobloxFile } from 'https://esm.sh/rbxm-parser-ts';

self.onmessage = async (event) => {
    const arrayBuffer = event.data;

    try {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Target file chunk buffer is entirely empty.");
        }

        console.log("[MRTLC WORKER] Initializing modern rbxm-parser-ts execution layout...");

        // 1. Convert incoming ArrayBuffer directly into a Node-like Buffer proxy for the library
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // 2. Read the Roblox file structure using the modern TS engine
        const file = RobloxFile.ReadFromBuffer(uint8Array);
        
        if (!file) {
            throw new Error("Invalid or corrupted Roblox binary format pattern.");
        }

        console.log("[MRTLC WORKER] Successfully read binary chunks. Structuring DOM metadata tree...");

        // 3. Extract the root descendants and transform them into a clean JSON tree for the UI
        const outputTree = processFileInstances(file.GetChildren());

        console.log(`[MRTLC WORKER] Build finished successfully. Shipping data node map back to UI thread.`);
        self.postMessage({ success: true, data: outputTree });

    } catch (error) {
        console.error("[MRTLC WORKER CORE FAULT]", error);
        self.postMessage({ success: false, error: `Engine Execution Crash: ${error.message}` });
    }
};

// Helper function to recursively clean the strongly-typed library objects into clean JSON
function processFileInstances(instancesList) {
    if (!instancesList || instancesList.length === 0) return [];

    return instancesList.map(ins => {
        // Safe property checks based on the modern TS typings layout
        const propertiesMap = {};
        
        // Extract available serialized metadata if attached
        if (ins.properties) {
            Object.keys(ins.properties).forEach(propName => {
                propertiesMap[propName] = { value: ins.properties[propName] };
            });
        }

        // Catch the script source explicitly if it's exposed natively by the parser
        const sourceValue = ins.Source || (ins.properties && ins.properties.Source) || null;

        return {
            ClassName: ins.ClassName || "Instance",
            Name: ins.Name || "UnnamedInstance",
            Source: typeof sourceValue === "string" ? sourceValue : (sourceValue?.value || null),
            Children: processFileInstances(ins.GetChildren ? ins.GetChildren() : [])
        };
    });
            }
