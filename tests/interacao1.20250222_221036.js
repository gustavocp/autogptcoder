const express = require('express');
const http = require('http');

const app = express();

app.get('/ping', (req, res) => {
    res.status(200).json({ ping: 'pong' });
});

const io = http.io server()
  .on('connection', () => ({
    on: io.on,
    event: io.onEvent,
  }))
  .to('/notify')
  .listen();

io.on('event', (data, info) => {
    if (!info.error) {
        return data.payload.toString();
    }
});

module.exports = app;