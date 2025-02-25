// Arquivo main.js (Server)
const express = require('express');
const http = require('http');
const WebSocket = require('ws'); // Importar apenas uma vez

let server;
let wss;

const app = express();

// Define endpoint para /ping
app.get('/ping', (req, res) => {
    res.status(200).json({ pong: 'pong' });
});

// Define endpoint para /notify
app.post('/notify', (req, res) => {
    req.json().then(data => {
        const ws = new WebSocket(data.client);
        wss.on('message', (event) => event.data);
    });
});

app.listen(3000, () => {
    server = http.createServer(app);
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('Cliente conectou com socket');
    });

    wss.on('close', () => {
        console.log('Cliente fechou conexao');
    });
});

// Arquivo express.js (API Primitiva)
const { createExpress } = require('express');
const { WebSocket } = require('ws'); // Importar somente uma vez

const expr = createExpress();
expr.get('/ping', (req, res) => {
    res.status(200).json({ pong: 'pong' });
});

expr.post('/notify', (req, res) => {
    const ws = new WebSocket(req.client);
    ws.on('message', (event) => event.data); // Emits messages received over the channel
});

expr.listen(5000, () => {
    console.log(' servidor express está rodando');
});