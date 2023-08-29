const http = require('http'); //step 2
const fs = require('fs');
const path = require('path');
const url = require('url'); //step 3

http.createServer((request, response) => {
  response.parsedUrl = url.parse(request.url, true);
  const filePath = response.parsedUrl.pathname === '/' ? 'index.html' : 'documentation.html'; // Use response.parsedUrl here

  const absolutePath = path.join(__dirname, filePath);

const timestamp = new Date();
const logEntry = `URL: ${request.url} | Timestamp: ${timestamp}\n`;

fs.appendFile('log.txt', logEntry, (err) => {
  if (err) {
    console.error('Error appending to log file:', err);
  } else {
    console.log('Log enty appended', logEntry);
  }
});
  fs.exists(absolutePath, (exists) => {
    if (exists) {
      fs.readFile(absolutePath, 'utf8', (err, data) => {
        if (err) {
          response.writeHead(500, { 'Content-Type': 'text/plain' });
          response.end('Internal Server Error');
        } else {
          response.writeHead(200, { 'Content-Type': 'text/html' });
          response.end(data);
        }
      });
    } else {
      // File not found, send a 404 response
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('File Not Found');
    }
  });
}).listen(8080);

console.log('My Node.js server is running on Port 8080.');