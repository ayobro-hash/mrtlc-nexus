/**
 * MRTLC Nexus Parser - Final Production Build
 * Features: Robust event-driven messaging, defensive DOM rendering, 
 * and automatic state recovery.
 */

// Global state references
const treeView = document.getElementById('tree-view');
const codePreview = document.getElementById('code-preview-box');
let compilationTimeout;

// 1. Defensively Initialize Worker with Cache-Buster
let nexusWorker = new Worker('nexus-worker.js?v=' + Date.now(), { type: 'module' });

nexusWorker.onmessage = (event) => {
    clearTimeout(compilationTimeout);
    
    const { success, isXml, xmlData, data, error } = event.data;

    // Reset UI state
    document.getElementById('main-compile-btn').classList.remove('active');
    document.getElementById('status-string').innerText = "Idle Mode";
    document.getElementById('load-progress').style.width = "0%";

    if (!success) {
        showError(error || "Unknown Parsing Failure");
        return;
    }

    // Clear previous tree before rendering
    treeView.innerHTML = '';

    // Route based on Worker's confirmed type
    if (isXml) {
        handleXmlParsing(xmlData);
    } else {
        handleBinaryParsing(data);
    }
};

// 2. Defensive XML Handler
function handleXmlParsing(xmlData) {
    console.log("[MRTLC] Routing to XML Parser...");
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, "text/xml");
        const rootItems = xmlDoc.querySelectorAll("roblox > Item, roblox > item");
        
        if (rootItems.length === 0) {
            showError("XML data structure appears empty.");
            return;
        }
        renderNexusTree(parseXmlNodes(rootItems), treeView);
    } catch (e) {
        showError("Critical XML Parsing Error.");
    }
}

// 3. Defensive Binary Handler
function handleBinaryParsing(data) {
    console.log("[MRTLC] Rendering Binary Data from Worker...");
    if (data && data.length > 0) {
        renderNexusTree(data, treeView);
    } else {
        showError("Binary data structure invalid or corrupted.");
    }
}

// 4. Shared UI Error Helper
function showError(msg) {
    treeView.innerHTML = `<span style="color: #ff3333; font-weight: bold;">[!] ${msg}</span>`;
    console.error("[MRTLC PARSER]", msg);
}

// Helper: Reset buttons if needed
function resetButton() {
    const btn = document.getElementById('main-compile-btn');
    btn.disabled = true;
    btn.classList.remove('active');
}
