const express = require('express');
const app = express();
app.use(express.json());
const { Server, listen } = express.Router();

let socket = null;

const handler = (req, res) => {
    if (socket && typeof req.type === 'websocket') {
        if (socket.readyState === 4) {
            socket.on('connect', () => {
                console.log('Cliente conectou');
            });
        }
        if (socket.readyState === 5) {
            socket.on('message', (event) => {
                event.preventDefault();
                res.send(`Mensagem recebida: ${event.data}`);
            });
        }
    }

    const result = new Promise((resolve) => {
        // Adicione aqui a lógica de tratamento do request
        req handling logic goes here;
        resolve({ status: 200 });
    });

    return result;
};

const router = express.Router();
router.get('/ping', (req, res) => {
    res.status(200).json({ pong: 'pong' });
});

// Adicione o endpoint para notificação
router.websocket('/notify', handler);

const PORT = process.env.PORT || 3000;

const server = new Server({
    server: app,
    listen: PORT,
    eventLoop: new Promise(resolve => setTimeout(resolve, 1000))
});

app.listen(PORT, () => {
    console.log(`Server está rodando em port ${PORT}`);
});

// Funcionalidade para enviar mensagens
const ws = new WebSocket('/notify');
ws.onmessage = (event) => {
    const message = event.data;
    console.log('Mensagem enviada:', message);
    // Adicione aqui a lógica para enviar messages via socket.io
};