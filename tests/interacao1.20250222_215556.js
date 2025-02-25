const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
    res.status(200).json({ ping: 'pong' });
});

app.listen(3000, () => {
    console.log('Server está rodando em 3000');
});