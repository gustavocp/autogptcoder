const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
    res.status(200).json({ pong: 'pong' });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});