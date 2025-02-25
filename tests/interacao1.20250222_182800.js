const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(3000, () => {
  console.log('API rodando em http://localhost:3000');
});