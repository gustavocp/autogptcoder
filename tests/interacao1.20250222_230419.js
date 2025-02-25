const express = require('express');
const socketio = require('@socketio/core');

const app = express();

// Pong endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({ pong: 'pong' });
});

// Socket.IO WebSocket endpoint
app.websocket('/notify')
    .on('close', () => {
        console.log('WebSocket connection closed by client.');
    })
    .start();

const ws = socketio('ws://localhost:3000/notify');

function handleMessage(event) {
    const message = event.data;
    if (message === 'pong') {
        console.log('Received pong from server!');
    }
}

// Example client usage
console.log('Calling /ping endpoint...');
fetch('http://localhost:3000/ping')
    .then((response) => console.log(response.json()));

console.log('\nCalling /notify endpoint...');
ws.onmessage = handleMessage;

// Note: To test the socket.io functionality, you can use a client-side tool