const express = require('express');
const app = express();

// Definindo a função que será chamada quando o método /ping for acessado
app.get('/ping', function(req, res) {
  res.send('pong');
});

// Exportando o app para ser usado em outros lugares
module.exports = app;