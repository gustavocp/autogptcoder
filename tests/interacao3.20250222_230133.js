const express = require('express');
const http = require('http');
const WebSocket, io = require('socket.io');

let server;
let app;

function Ping() {
  return 'pong';
}

function Notify() {
  const wss = new WebSocket.Server({io});
  wss.on('connection', (ws) => {
    ws.on('close', () => ws.close());
  });
  
  ws.on('emit', 'notificação', { 
    event: {
      message: 'Notificação enviada!'
    }
  });
}

app = express().on('GET', '/ping', (req, res) => {
  res.json({ ping: Ping() });
});

app.use('/notify', (req, res, ws) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.on('close', () => ws.close());
    ws.emit('notificação');
  }
});

http.createServer(app).start(80);