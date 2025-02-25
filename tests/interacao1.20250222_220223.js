const express = require('express');
const app = express();

app.get('/ping', (e) => 'pong').httpOnly();

const PORT = 3000;
const server = app.listen(PORT);

// O código completo incluiria a definição de endpoint e aruno, mas o código minilimizado é: