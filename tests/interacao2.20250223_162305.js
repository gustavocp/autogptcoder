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

Erro:
C:\Projetos\node-llm-assistant-free\node_modules\socket.io\dist\index.js:213
            throw new Error(msg);
            ^

Error: You are trying to attach socket.io to an express request handler function. Please pass a http.Server instance.
    at Server.attach (C:\Projetos\node-llm-assistant-free\node_modules\socket.io\dist\index.js:213:19)
    at new Server (C:\Projetos\node-llm-assistant-free\node_modules\socket.io\dist\index.js:119:18)
    at module.exports (C:\Projetos\node-llm-assistant-free\node_modules\socket.io\dist\index.js:801:33)
    at [eval]:6:32
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:118:14
    at [eval]-wrapper:6:24
    at runScript (node:internal/process/execution:101:62)
    at evalScript (node:internal/process/execution:133:3)
    at node:internal/main/eval_string:51:3

Node.js v20.18.2