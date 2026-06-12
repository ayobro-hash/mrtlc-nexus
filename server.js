const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve your root files (like index.html) automatically
app.use(express.static(__path));

// Fallback routing to ensure index.html always launches
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 MRTLC NEXUS LOCAL TESTING MATRIX ONLINE`);
    console.log(`👉 Access Host Environment: http://localhost:${PORT}\n`);
});
