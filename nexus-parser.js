// nexus-parser.js - Running on the Main UI Thread

// 1. Target your elements exactly by their HTML attributes
const compileBtn = document.getElementById('main-compile-btn');
const fileInput = document.getElementById('nexusFileInput'); // Ensure your <input type="file" id="nexusFileInput"> matches this ID
const outputDisplay = document.getElementById('output');

// 2. Initialize the Nexus Web Worker
const nexusWorker = new Worker('nexus-worker.js', { type: 'module' });

// 3. Keep button locked until a real file is dropped in
if (fileInput) {
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            compileBtn.removeAttribute('disabled');
            compileBtn.style.opacity = "1";
            compileBtn.style.cursor = "pointer";
        } else {
            compileBtn.setAttribute('disabled', 'true');
        }
    });
}

// 4. Expose the execution function globally for the HTML onclick handler
window.executeNexusCompilation = async function() {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select an .rbxm file first!");
        return;
    }

    // Set UI processing states
    compileBtn.innerText = "PROCESSING CHUNKS...";
    compileBtn.setAttribute('disabled', 'true');

    try {
        // Extract the raw file byte array
        const arrayBuffer = await file.arrayBuffer();

        // Transfer the buffer ownership directly to the worker thread (0ms overhead)
        nexusWorker.postMessage(arrayBuffer, [arrayBuffer]);
    } catch (err) {
        console.error("Failed to read file buffer:", err);
        resetButton();
    }
};

// 5. Catch the processed data coming back from the worker thread
nexusWorker.onmessage = (event) => {
    resetButton();

    const { success, data, error } = event.data;

    if (success) {
        console.log("Nexus compilation complete:", data);
        
        // Output the JSON structure cleanly inside your display block
        if (outputDisplay) {
            outputDisplay.innerHTML = `<pre style="color: #00ff00; text-align: left;">${JSON.stringify(data, null, 2)}</pre>`;
        }
    } else {
        console.error("Compilation Thread Failure:", error);
        if (outputDisplay) outputDisplay.innerText = "Error compiling: " + error;
    }
};

function resetButton() {
    compileBtn.innerText = "COMPILE SOURCE CHUNKS";
    compileBtn.removeAttribute('disabled');
}
