const http = require('http');
const hostname = 'localhost';
const port = 3000;

http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('pong\n');
}).listen(port, hostname);

console.log('Servidor está rodando na porta', port);