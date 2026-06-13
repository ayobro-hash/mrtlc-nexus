import { parseBuffer } from 'rbx-reader';

// 1. Grab your HTML file picker element
const fileInput = document.getElementById('myFileInput'); 

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // 2. Read the file as raw binary chunks instead of a text string
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer); // Convert to Node-compatible buffer

        // 3. Let rbx-reader handle the binary heavy lifting
        const parsedData = parseBuffer(buffer);
        
        console.log("Successfully parsed structure:", parsedData);
        
        // 4. Send the clean data to your UI rendering function!
        updateMyUI(parsedData);

    } catch (err) {
        console.error("Binary parser failed:", err);
        alert("Could not parse .rbxm file. Ensure it is not corrupted!");
    }
});

// 5. Update your UI with the clean results
function updateMyUI(instances) {
    const display = document.getElementById('uiTreeContainer');
    display.innerHTML = ''; // Clear out the loading state

    instances.forEach(ins => {
        const row = document.createElement('div');
        row.className = 'explorer-item';
        row.innerText = `📦 ${ins.ClassName} - ${ins.Name}`;
        display.appendChild(row);
    });
}
