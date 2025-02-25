const express = require('express');
const app = express();

// Define o endpoints para /ping que retorne 'pong'
app.get('/ping', (req, res) => {
    res.json({ pong: 'pong' });
});

app.listen(3000, () => {
    console.log('Server está rodando em http://localhost:3000');
});