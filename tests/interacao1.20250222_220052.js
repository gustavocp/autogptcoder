const express = require('express');
const app = express();

// Criei um servidor HTTP usando Node.js com o framework Express.js
app.get('/api/', (req, res) => {
  res.send('List of available endpoints:<br>ping endpoint');
});

// Adicionei um endpoint para /ping que retorne 'pong'
app.post('/ping', (req, res) => {
  res.json({ pong: 'pong' });
});

// Executei o servidor
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});