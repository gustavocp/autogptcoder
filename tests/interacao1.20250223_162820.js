const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Rota para /ping e retornar 'pong'
app.get('/', (req, res) => {
  res.send('pong');
});

// Rotas para outras rotas que não existam
app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

// Exportando o app
module.exports = app;