const express = require('express');
let app = express();

// Configurar o socketio-server para usar com express
const SocketIO = require('socket.io/server').Server;

const serverOptions = {
  listen: '0.0.0.0',
  port: 3001,
};

const server = new SocketIO(serverOptions);

app.use(express.json());

// Configurar o endpoint /ping
app.get('/ping', (e) => {
    e.preventDefault();
    return 'pong';
});

// Configurar o endpoint /notify
app.get('/notify', (e) => {
    e.preventDefault();
    if (server && !e.isServer && e.origin !== null) {
        server.emit('pong');
    }
});

// Iniciar o servidor
const PORT = 3001;
server.start(PORT);