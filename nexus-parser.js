// Inside mrtlc-parser.js

let compilationTimeout = null;

window.executeNexusCompilation = async function() {
    const file = fileInput.files[0];
    if (!file) {
        alert("Select an active structural file stream first.");
        return;
    }

    // Toggle compilation states
    compileBtn.innerText = "PROCESSING CHUNKS...";
    compileBtn.setAttribute('disabled', 'true');
    
    if (treeView) treeView.innerHTML = `<span style="color: #00ff00;">[STATUS] Extracting payload buffer stream...</span>`;
    if (codePreviewBox) codePreviewBox.value = "";

    // Clear any leftover timers
    clearTimeout(compilationTimeout);

    // START WATCHDOG: If the parser loops infinitely, this breaks the deadlock
    compilationTimeout = setTimeout(() => {
        console.warn("[MRTLC WATCHDOG] Compilation took too long. Task forcefully aborted.");
        
        // Terminate the stuck background thread completely
        nexusWorker.terminate();
        
        // Re-initialize a fresh worker instance so the next click works
        window.nexusWorker = new Worker('nexus-worker.js', { type: 'module' });
        
        if (treeView) {
            treeView.innerHTML = `<span style="color: #ffaa00;">[TIMEOUT FAILED] Binary decoding halted. This .rbxm layout uses a modern chunk compression format that the 2023 rbxBinaryParser core cannot decompress synchronously.</span>`;
        }
        resetButton();
    }, 10000); // 10 seconds till forced stop

    try {
        const arrayBuffer = await file.arrayBuffer();
        nexusWorker.postMessage(arrayBuffer, [arrayBuffer]);
    } catch (err) {
        console.error("Payload read failure:", err);
        clearTimeout(compilationTimeout);
        resetButton();
    }
};

// Inside your nexusWorker.onmessage block, clear the timer instantly when successful:
nexusWorker.onmessage = (event) => {
    clearTimeout(compilationTimeout); // Clear the watchdog immediately
    resetButton();

    const { success, data, error } = event.data;
    // ... rest of your tree rendering code stays exactly the same
};
