// Simple server to run the voice node test
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.url}`);
  
  // Normalize URL to prevent path traversal attacks
  let filePath = path.join(__dirname, '..', '..', req.url);
  
  // Default to index.html for root requests
  if (req.url === '/' || req.url === '') {
    filePath = path.join(__dirname, 'voice-node-test.html');
  }
  
  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
      
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}/`);
  console.log(`Open http://localhost:${PORT}/ to test the VoiceNode`);
});
