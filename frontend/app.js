// require('./tracing.js');

const fs = require('fs').promises;
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);

app.use(express.static('public'));

app.get('/', async (req, res) => {
  const content = await fs.readFile('./public/index.html', { encoding: 'utf-8' });
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(content);
});

module.exports = server;
