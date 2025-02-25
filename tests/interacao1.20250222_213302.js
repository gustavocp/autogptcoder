// coding: utf-8
const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
    res.json({ pong: 'pong' });
});

// Use a library like socket.io for real-time communication later on.
// Remember to install it using npm install socket.io