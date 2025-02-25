const http = require('http');
const { createServer } = http;

// Método Ping
const ping = (req, res) => {
    res.end("Pong");
};

// Inicializar servidor
const server = createServer(ping);

server.listen(3000, () => {
    console.log("Servidor rodando na porta 3000");
});