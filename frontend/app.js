const fs = require('fs').promises;
const express = require('express');

const app = express();

app.use(express.static('public'));

app.get('/', async (req, res) => {
  const content = await fs.readFile('./public/index.html', { encoding: 'utf-8' });
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(content);
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});