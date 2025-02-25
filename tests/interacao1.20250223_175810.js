const express = require('express');
const axios = require('axios');

const app = express();

app.get('/ping', (req, res) => {
    res.send('pong');
});

// Teste a função de axios
function testAxios() {
    try {
        const response = await axios.get('http://localhost:3001/ping');
        console.log(response.data);
    } catch (error) {
        console.error('Erro ao fazer chamada à API:', error);
    }
}

testAxios();