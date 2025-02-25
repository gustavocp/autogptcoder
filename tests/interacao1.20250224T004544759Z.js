const express = require('express');

// Crie a instancia do Express
const app = express();

// Adicione um método à API com a função /ping e retorne 'pong'
app.get('/ping', (req, res) => {
  return res.status(200).send('pong');
});

// Exporte o objeto para ser utilizado na aplicação
module.exports = app;