// nexus-worker.js - The Background Compilation Core
import { decode } from 'https://cdn.jsdelivr.net/gh/MrSprinkleToes/rbxBinaryParser@master/rbxBinaryParser.js';

self.onmessage = async (event) => {
    const arrayBuffer = event.data;

    try {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Target data stream block is empty.");
        }

        // Decompress and deserialize the raw .rbxm file byte stream
        const parsedData = decode(arrayBuffer);

        // Dispatch clean JSON structure array back to index.html
        self.postMessage({ success: true, data: parsedData });

    } catch (error) {
        // Fallback error messenger ensures your UI button never hangs forever
        self.postMessage({ success: false, error: error.message });
    }
};
