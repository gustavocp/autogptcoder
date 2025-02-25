const express = require('express');
const WebSocket = require('ws');
const eventlet = require('eventlet');

const app = express();

// Pong endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({ pong: 'pong' });
});

// Notify endpoint with WebSocket
app.websocket('/notify')
    .on('close', () => closeWebSocket())
    .start();

function closeWebSocket() {
    const ws = eventlet.ws();
    if (ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
}

// Example client usage
console.log('Calling /ping endpoint...');
fetch('http://localhost:3000/ping')
    .then((response) => console.log(response.json()));

console.log('\nCalling /notify endpoint...');
const ws = new WebSocket('ws://localhost:3000/notify');
ws.onmessage = (event) => {
    const message = event.data;
    if (message === 'pong') {
        console.log('Received pong from server!');
    }
};