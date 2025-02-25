const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Configuração do Express
const app = express();
const server = http.createServer(app);

// Inicializando Socket.IO
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.id}`);
  });
});

// Configurando porta do servidor
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});