const fs = require('fs').promises;
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);

// Add basic health check endpoints
app.use('/ready', (request, response) => {
  return response.sendStatus(200);
});

app.use('/live', (request, response) => {
  return response.sendStatus(200);
});

app.use(express.static('public'));

app.get('/', async (req, res) => {
  const content = await fs.readFile('./public/index.html', { encoding: 'utf-8' });
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(content);
});

module.exports = server;
