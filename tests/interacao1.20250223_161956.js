// Importações necessárias
const express = require('express');
const app = express();
const port = 3000;

// Método /ping na API
app.get('/ping', (req, res) => {
    res.send('pong');
});

// Configuração da API
app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});