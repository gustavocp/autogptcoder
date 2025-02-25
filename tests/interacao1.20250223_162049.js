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