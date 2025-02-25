const express = require('express');
const app = express();
const http = require('http');

const socket = require('socket.io');
const Socket = socket();

const handler = () => {
  return {
    ping: async (req, res) => {
      res.status(200).json({ message: 'pong' });
    },
    notify: async (req, res) => {
      const io = new Socket('/socket', { origin: req.origin });

      io.on('connection', () => {
        console.log('Conexão estabelecida com o cliente');
        io.emit('message', { id: 1, message: 'Notified' });
      });
    }
  };
};

app.use(express.json());
app.use(handler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server está rodando em http://localhost:${PORT}`);
});