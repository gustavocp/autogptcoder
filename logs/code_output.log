const express = require('express');
const http = require('http');

// Importa socket.io
const io = require('socket.io');

// Configuração do servidor de ping-pong
const PORT = 3000;
const server = io.listen(PORT);

// Método para simular o ping
server.on('ping', (request, callback) => {
    callback(null, 'Pong');
});

// Método que envia um pong ao cliente
server.on('/socket', (request, callback) => {
    io.emit('pong', null);
});

const app = express();

app.use(express.static(__dirname + '/public'));

const PORT = 3000;
http.createServer(app).listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});