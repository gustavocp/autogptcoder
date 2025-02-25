const express = require('express');
const app = express();
app.use(express.static(__dirname + '/public'));

// Configurações do Socket.IO
const io = require('socket.io')(app);
io.on('connection', (socket) => {
  console.log(`Nova conexão: ${socket.id}`);
});

// Rota para retornar a API em tempo real
app.get('/api/data', (req, res) => {
  return res.json({ data: 'Esta é uma resposta para a requisição' });
});

const socket = io;

module.exports = { socket };

// Verifique se as conexões estão funcionando corretamente
test('Socket.io connection', () => {
  const server = express();
  server.use(express.static(__dirname + '/public'));
  const httpServer = require('http').createServer(server);
  const socketIO = require('socket.io')(httpServer);

  // Adicione as conexões ao servidor do socket.io
  io.on('connection', (socket) => {
    console.log(`Nova conexão: ${socket.id}`);
  });

  // Verifique se a conexão está funcionando corretamente
  httpServer.listen(3000, () => {
    const { socket } = io;

    setTimeout(() => {
      if (!socket.connected) {
        console.error('Socket disconnected');
      }
    }, 500);
  });
});