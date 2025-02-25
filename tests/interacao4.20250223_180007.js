const express = require('express');
const axios = require('axios');

const app = express();

app.get('/ping', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:3001/ping');
        res.send(response.data);
    } catch (error) {
        console.error('Erro ao fazer chamada à API:', error);
        return;
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000!');
});