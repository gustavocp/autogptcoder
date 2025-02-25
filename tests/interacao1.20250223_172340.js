// Importante: Não se esqueça de importar express para usar na função '/ping'

const express = require('express');

const app = express();

app.get('/ping', (req, res) => {
  res.send('pong');
});

// Exporte o app
module.exports = app;