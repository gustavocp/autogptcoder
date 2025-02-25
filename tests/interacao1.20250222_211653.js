const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
    res.status(200).json({ ping: 'pong' });
});

app.listen(3000, () => {
    console.log('Serving API on port 3000');
});