const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Pong!');
});

app.listen(3000, () => {
  console.log('API está rodando na porta 3000');
});