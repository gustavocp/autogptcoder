const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});