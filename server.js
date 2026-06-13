// server.js - Your Termux Web Delivery Engine
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Mapping out common Web MIME types so your browser parses JavaScript workers correctly
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png'
};

const server = http.createServer((req, res) => {
    // Default to index.html if the user hits the root URL
    let filePath = req.url === '/' ? './index.html' : '.' + req.url;
    let extname = String(path.extname(filePath)).toLowerCase();
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}\n`);
            }
        } else {
            // Success: Deliver the Nexus script files cleanly to localhost
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Nexus Engine Active! Open your browser at: http://localhost:${PORT}`);
});
