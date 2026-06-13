// worker.js - The background brain for your Helio G81
import { parseBuffer } from 'rbx-reader';

self.onmessage = async (event) => {
    // 1. Grab the raw file bytes sent from the main thread
    const arrayBuffer = event.data;

    try {
        // 2. Convert raw browser array buffer to a Node-compatible buffer for rbx-reader
        const buffer = Buffer.from(arrayBuffer);

        // 3. Decompress and parse the .rbxm layout
        const parsedData = parseBuffer(buffer);

        // 4. Send the structured data object back to your main UI thread
        self.postMessage({ success: true, data: parsedData });

    } catch (error) {
        // Prevent a complete application freeze if the file data is corrupted
        self.postMessage({ success: false, error: error.message });
    }
};
